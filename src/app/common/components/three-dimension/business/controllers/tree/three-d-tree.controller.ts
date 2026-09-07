import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PathTool } from '../../../../../tools/path-tool/path.tool';
import { RenderMode } from '../../models/types';
import { SceneService } from '../../services/scene.service';
import { ThreeDTreeModel } from './three-d-tree.model';

/** 场景灯光较强（ambient/key 2.5/3.0），带贴图的树会被照得过曝、颜色偏浅。
 *  统一压暗漫反射 albedo 以接近 3D 查看器的自然亮度（0~1，越小越暗，可调）。 */
const TREE_BRIGHTNESS = 0.3;

/** 树在屏幕上的像素高度阈值（单位：像素），代表最大减树档（画质 q=0）的端点：
 *  低于 TREE_CULL_PX 直接不画；介于 CULL 与 FULL 之间按比例抽稀（越远越稀）；
 *  达到 FULL 全量绘制。实际阈值随画质 q 线性插值到 0（q=1 时完全不减树）。
 *  用“屏幕像素大小”而非世界距离，可随缩放/视口/FOV 自动适配。 */
const TREE_CULL_PX = 3;
const TREE_FULL_PX = 26;

/** 密集林区判定：以树为中心、半径 TREE_NEIGHBOR_RADIUS（世界单位）内的邻居数超过
 *  TREE_ISOLATED_MAX 视为密集林区（随机抽稀）；否则为成排/孤植等结构树（沿排交替消失）。 */
const TREE_NEIGHBOR_RADIUS = 10;
const TREE_ISOLATED_MAX = 4;

/** 成排树的“隔一棵消失”键值：链上奇数位的树分配该值（抽稀密度低于它即被移除），
 *  偶数位分配 0（永不移除）。值越接近 1，成排树越晚开始交替消失。 */
const TREE_ROW_ALTERNATE_KEY = 0.9;

/** 由树位置生成稳定抽样值 [0,1)，用于远景抽稀：同一棵树多次 updateLod 结果一致，避免帧间闪烁 */
function hash01(x: number, z: number): number {
  const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

/** 一棵树模板：按材质合并后的几何体（每材质一个合并几何体） */
interface TreeTemplate {
  parts: { geometry: THREE.BufferGeometry; material: THREE.Material }[];
  /** 树模型的世界高度（未缩放），用于屏幕像素尺寸换算 */
  height: number;
}

/** 一个 type 下的实例组：同一模板的多个 InstancedMesh（每个 part 一个）共享同一组实例矩阵 */
interface TreeGroup {
  items: ThreeDTreeModel[];
  /** 与 items 一一对应的世界坐标，供距离/视锥裁剪时快速读取，避免重复 new Vector3 */
  positions: THREE.Vector3[];
  meshes: THREE.InstancedMesh[];
  /** 树模型世界高度（未缩放），每棵树的屏幕高度 = height × scale */
  height: number;
  /** 每棵树的抽稀键值 [0,1)：密集林区为稳定随机值，成排树为“隔一棵”交替值，
   *  孤植/小簇为 0。抽稀密度低于键值即移除该树（键值 0 永不移除）。 */
  keys: number[];
}

/**
 * 树控制器：从 tree-models.json 读取树的摆放信息，加载树模型（PathTool.three.tree.model(type)）
 * 并加入主场景。树仅在 solid 渲染模式下显示。
 *
 * 性能说明：建模侧已合并树模型，GLB 每个网格即一个独立部分；这里直接用 InstancedMesh
 * 批量实例化，把 100 棵树的 draw call 降到个位数。
 */
@Injectable()
export class ThreeDTreeController {
  private sceneService = inject(SceneService);
  private loader = new GLTFLoader();

  /** 所有树实例的根节点，加入主 scene，通过 visible 统一控制显隐 */
  private root = new THREE.Group();
  /** 树模板缓存：URL → 合并后的模板（同一模型文件只加载/合并一次） */
  private templateCache = new Map<string, TreeTemplate>();
  /** 按 type 分组的实例网格，用于按屏幕像素大小/视锥动态减树 */
  private groups = new Map<number, TreeGroup>();
  /** 已创建的所有 InstancedMesh，用于释放资源 */
  private instanced: THREE.InstancedMesh[] = [];

  private loaded = false;
  private loading = false;
  private visible = false;

  /** 相机 change 回调引用，dispose 时移除监听 */
  private onCameraChange = () => this.updateLod();

  /** LOD 裁剪复用的临时对象，避免每帧分配 */
  private dummy = new THREE.Object3D();
  private frustum = new THREE.Frustum();
  private projScreenMatrix = new THREE.Matrix4();
  private sphere = new THREE.Sphere();

  constructor() {
    this.root.name = 'trees';
  }

  /**
   * 同步树的显隐：show 为外部「是否显示树」开关，mode 为渲染模式。
   * 仅当 show 为 true 且 mode 为 solid 时显示树；首次显示时异步加载树模型。
   * 场景未初始化（sceneService.scene 尚未创建）时只更新显隐标记，不触发加载。
   */
  sync(mode: RenderMode, show: boolean = true): void {
    this.visible = show && mode === RenderMode.solid;
    this.root.visible = this.visible;
    if (this.visible && !this.loaded && !this.loading && this.sceneService.scene) {
      void this.load();
    }
    this.sceneService.requestRender();
  }

  /* ---- 加载 ---- */

  private async load(): Promise<void> {
    this.loading = true;
    try {
      const trees = await this.fetchTreeModels();
      if (trees.length === 0) return;

      /* 预计算每棵树的抽稀键值：密集林区随机、成排树隔一棵交替、孤植/小簇永不抽 */
      const keys = this.computeTreeKeys(trees);

      /* 按 type 分组实例化（目前所有 type 指向同一模型，但保留扩展性） */
      const byType = new Map<number, { item: ThreeDTreeModel; key: number }[]>();
      for (let i = 0; i < trees.length; i++) {
        const t = trees[i];
        const arr = byType.get(t.type);
        if (arr) arr.push({ item: t, key: keys[i] });
        else byType.set(t.type, [{ item: t, key: keys[i] }]);
      }

      for (const [type, entries] of byType) {
        const template = await this.getTemplate(type);
        if (template) this.buildInstanced(type, template, entries);
      }

      if (!this.root.parent) {
        this.sceneService.scene.add(this.root);
      }
      this.root.visible = this.visible;
      this.loaded = true;
      this.sceneService.requestRender();

      /* 相机移动（旋转/平移/缩放/阻尼）时按距离与视锥动态减树 */
      this.sceneService.controls.addEventListener('change', this.onCameraChange);
      /* 首次载入即按当前相机裁剪一次，避免一次性画出全部树 */
      this.updateLod();
    } catch (err) {
      console.warn('[ThreeDTreeController] 树模型加载失败:', err);
    } finally {
      this.loading = false;
    }
  }

  private async fetchTreeModels(): Promise<ThreeDTreeModel[]> {
    const url = `${PathTool.three.tree.json()}?t=${Date.now()}`;
    const res = await fetch(url);
    return res.json() as Promise<ThreeDTreeModel[]>;
  }

  /** 获取（并按需加载）指定 type 的树模板；以 URL 为缓存键，同一文件只处理一次 */
  private async getTemplate(type: number): Promise<TreeTemplate | null> {
    const url = PathTool.three.tree.model(type);
    const cached = this.templateCache.get(url);
    if (cached) return cached;

    try {
      const gltf = await this.loader.loadAsync(url);
      const template = gltf.scene as THREE.Group;
      template.updateMatrixWorld(true);

      /* 建模侧已合并模型，GLB 里每个网格即一个独立部分，无需在代码里再 mergeGeometries。
       * 直接 clone 每个网格几何体并烘焙变换（去掉单位换算缩放），作为实例化的一部分。
       * 材质保留 GLTF 的标准材质（带光照，贴近 3D 查看器的观感），只压暗 albedo 降低过曝。 */
      const parts: TreeTemplate['parts'] = [];
      /* 累计模板几何体 Y 轴包围盒，得到树模型未缩放时的世界高度 */
      let maxY = -Infinity;
      let minY = Infinity;
      template.traverse((c) => {
        if (!(c as THREE.Mesh).isMesh) return;
        const mesh = c as THREE.Mesh;
        const material = (
          Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
        ) as THREE.MeshStandardMaterial;

        /* setScalar 为绝对值，缓存复用同一材质时不会重复压暗 */
        material.color.setScalar(TREE_BRIGHTNESS);

        const geo = mesh.geometry.clone();
        /* 模型已修正单位，直接烘焙 matrixWorld（含 scale）即可，无需再丢弃 scale。 */
        geo.applyMatrix4(mesh.matrixWorld);
        geo.computeBoundingBox();
        if (geo.boundingBox) {
          if (geo.boundingBox.max.y > maxY) maxY = geo.boundingBox.max.y;
          if (geo.boundingBox.min.y < minY) minY = geo.boundingBox.min.y;
        }

        parts.push({ geometry: geo, material });
      });

      /* 模板网格几何体已 clone 到 parts，释放原几何体（材质仍被 InstancedMesh 复用，不释放） */
      template.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).geometry.dispose();
      });

      /* 高度兜底 5，避免平面几何体导致像素恒为 0 */
      const height = maxY > minY ? maxY - minY : 5;
      const result: TreeTemplate = { parts, height };
      this.templateCache.set(url, result);
      return result;
    } catch (err) {
      console.warn(`[ThreeDTreeController] 加载树模板失败 (${url}):`, err);
      return null;
    }
  }

  /** 用模板几何体为每棵树写入实例矩阵，构建 InstancedMesh */
  private buildInstanced(
    type: number,
    template: TreeTemplate,
    entries: { item: ThreeDTreeModel; key: number }[],
  ): void {
    const items = entries.map((e) => e.item);
    const keys = entries.map((e) => e.key);
    const meshes: THREE.InstancedMesh[] = [];
    /* 预计算世界坐标，后续 distanceTo/包围球测试直接复用，避免每帧 new */
    const positions = items.map((t) => new THREE.Vector3(t.position.x, t.position.y, t.position.z));
    const dummy = new THREE.Object3D();
    for (const part of template.parts) {
      const im = new THREE.InstancedMesh(part.geometry, part.material, items.length);

      for (let i = 0; i < items.length; i++) {
        const t = items[i];
        dummy.position.set(t.position.x, t.position.y, t.position.z);
        dummy.rotation.set(0, THREE.MathUtils.degToRad(t.direction), 0);
        /* scale 为统一缩放系数，直接应用于各轴 */
        dummy.scale.set(t.scale, t.scale, t.scale);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
      /* 实例矩阵会平移实例，几何体自身的包围球不再覆盖所有实例，必须关闭视锥剔除，
       * 否则相机只面向部分树时整组会被错误剔除；改为 updateLod 手动做逐实例裁剪 */
      im.frustumCulled = false;

      meshes.push(im);
      this.instanced.push(im);
      this.root.add(im);
    }
    this.groups.set(type, { items, positions, meshes, height: template.height, keys });
  }

  /** 计算每棵树的抽稀键值 [0,1)：
   *  - 密集林区（邻居数 > TREE_ISOLATED_MAX）：稳定随机值，抽稀后呈自然稀疏林相；
   *  - 成排树（度数 ≤ 2 且可连成链）：沿链交替标记，抽稀时“隔一棵消失”而非随机缺棵；
   *  - 孤植/小簇（其余非密集树）：键值 0，永不移除。
   *  仅在加载时执行一次。 */
  private computeTreeKeys(trees: ThreeDTreeModel[]): number[] {
    const n = trees.length;
    const R2 = TREE_NEIGHBOR_RADIUS * TREE_NEIGHBOR_RADIUS;

    /* 邻接表：水平面（x,z）半径 R 内的邻居索引（1200 棵树 O(n²) 代价可忽略） */
    const neighbors: number[][] = Array.from({ length: n }, () => []);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = trees[i].position.x - trees[j].position.x;
        const dz = trees[i].position.z - trees[j].position.z;
        if (dx * dx + dz * dz < R2) {
          neighbors[i].push(j);
          neighbors[j].push(i);
        }
      }
    }

    const keys = neighbors.map((nb, i) =>
      nb.length > TREE_ISOLATED_MAX ? hash01(trees[i].position.x, trees[i].position.z) : 0,
    );

    /* 沿成排链交替标记：只遍历度数 ≤ 2 的节点（孤植/端点/链中），奇数位赋交替键值 */
    const visited = new Array<boolean>(n).fill(false);
    const walk = (start: number): void => {
      let idx = 0;
      let cur = start;
      let prev = -1;
      while (cur !== -1) {
        visited[cur] = true;
        if (idx % 2 === 1) keys[cur] = TREE_ROW_ALTERNATE_KEY;
        let next = -1;
        for (const nb of neighbors[cur]) {
          if (nb === prev || visited[nb] || neighbors[nb].length > 2) continue;
          next = nb;
          break;
        }
        prev = cur;
        cur = next;
        idx++;
      }
    };

    /* 先由链端点（度数 0/1）出发覆盖整条链，再处理剩余度数 2 的成环链 */
    for (let i = 0; i < n; i++) {
      if (visited[i] || neighbors[i].length > 1) continue;
      walk(i);
    }
    for (let i = 0; i < n; i++) {
      if (visited[i] || neighbors[i].length !== 2) continue;
      walk(i);
    }

    return keys;
  }

  /** 按屏幕像素大小 + 视锥裁剪动态收缩实例数：远景树按比例抽稀，只把保留的树写进实例矩阵前段
   *  并缩小 count，其余实例不再被 GPU 处理。由相机 change 触发，镜头静止时不做任何计算。 */
  private updateLod(): void {
    const cam = this.sceneService.camera;
    /* change 事件先于本帧渲染触发，相机 world 矩阵尚未刷新，需手动同步后再算视锥 */
    cam.updateMatrixWorld();
    this.projScreenMatrix.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    const camPos = cam.position;

    /* 屏幕像素尺寸换算（透视：随距离变大；正交：与距离无关，用固定视高） */
    const screenH = this.sceneService.renderer?.domElement?.clientHeight || 600;
    const isPerspective = cam instanceof THREE.PerspectiveCamera;
    /* 画质 q（0..1）：1=全量不减树，0=最大减树。低帧率时由 SceneService 动态下调 */
    const q = this.sceneService.treeQuality;
    const reduce = q < 1;
    const cullPx = TREE_CULL_PX * (1 - q);
    const fullPx = TREE_FULL_PX * (1 - q);

    for (const group of this.groups.values()) {
      const items = group.items;
      let count = 0;
      for (let i = 0; i < items.length; i++) {
        const t = items[i];
        const p = group.positions[i];

        /* 视锥裁剪：只画视野内的树（树干中心 + 约一个树冠半径的包围球） */
        this.sphere.center.copy(p);
        this.sphere.center.y += 1;
        this.sphere.radius = 2.5 * t.scale;
        if (!this.frustum.intersectsSphere(this.sphere)) continue;

        if (reduce) {
          /* 屏幕像素高度 = 树的世界高度 ÷ 该距离处每像素对应的世界单位 */
          const dist = camPos.distanceTo(p);
          const viewH = isPerspective
            ? 2 * dist * Math.tan(THREE.MathUtils.degToRad((cam as THREE.PerspectiveCamera).fov) / 2)
            : 20 / (cam as THREE.OrthographicCamera).zoom;
          const worldPerPixel = viewH / screenH;
          const pixels = (group.height * t.scale) / worldPerPixel;

          /* 太小直接不画；介于 cullPx 与 fullPx 之间按稳定抽样值抽稀（越远越稀） */
          if (pixels < cullPx) continue;
          if (pixels < fullPx) {
            const density = (pixels - cullPx) / (fullPx - cullPx);
            /* 键值大于当前密度则移除：密集林区随机、成排树隔一棵交替、孤植/小簇(0)永不抽 */
            if (group.keys[i] > density) continue;
          }
        }

        this.dummy.position.set(t.position.x, t.position.y, t.position.z);
        this.dummy.rotation.set(0, THREE.MathUtils.degToRad(t.direction), 0);
        this.dummy.scale.set(t.scale, t.scale, t.scale);
        this.dummy.updateMatrix();

        /* 该 group 内所有 part 共享同一组实例布局，需同步写入 */
        for (const mesh of group.meshes) {
          mesh.setMatrixAt(count, this.dummy.matrix);
        }
        count++;
      }
      for (const mesh of group.meshes) {
        mesh.count = count;
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  /* ---- dispose ---- */

  dispose(): void {
    if (this.sceneService.controls) {
      this.sceneService.controls.removeEventListener('change', this.onCameraChange);
    }
    if (this.root.parent) this.root.parent.remove(this.root);
    this.root.clear();
    for (const im of this.instanced) {
      im.dispose();
      im.geometry.dispose();
      const mat = im.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    }
    this.instanced = [];
    this.groups.clear();
    this.templateCache.clear();
    this.loaded = false;
    this.loading = false;
    this.visible = false;
  }
}
