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

/** 树的最大渲染距离（世界单位）：相机到树的距离超过该值时跳过绘制。
 *  镜头拉远（俯瞰全景）时自动减树、拉近时恢复完整细节，降低 GPU 顶点处理压力。
 *  树的分布范围约 130 单位，设 800 既能保证近景整片树可见，又能在远景时及时减树。 */
const TREE_MAX_DISTANCE = 800;

/** 一棵树模板：按材质合并后的几何体（每材质一个合并几何体） */
interface TreeTemplate {
  parts: { geometry: THREE.BufferGeometry; material: THREE.Material }[];
}

/** 一个 type 下的实例组：同一模板的多个 InstancedMesh（每个 part 一个）共享同一组实例矩阵 */
interface TreeGroup {
  items: ThreeDTreeModel[];
  /** 与 items 一一对应的世界坐标，供距离/视锥裁剪时快速读取，避免重复 new Vector3 */
  positions: THREE.Vector3[];
  meshes: THREE.InstancedMesh[];
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
  /** 按 type 分组的实例网格，用于按相机距离/视锥动态减树 */
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
   * 同步渲染模式：solid 显示树，其余模式隐藏。首次进入 solid 时异步加载树模型。
   * 场景未初始化（sceneService.scene 尚未创建）时只更新显隐标记，不触发加载。
   */
  sync(mode: RenderMode): void {
    this.visible = mode === RenderMode.solid;
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

      /* 按 type 分组实例化（目前所有 type 指向同一模型，但保留扩展性） */
      const byType = new Map<number, ThreeDTreeModel[]>();
      for (const t of trees) {
        const arr = byType.get(t.type);
        if (arr) arr.push(t);
        else byType.set(t.type, [t]);
      }

      for (const [type, items] of byType) {
        const template = await this.getTemplate(type);
        if (template) this.buildInstanced(type, template, items);
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

        parts.push({ geometry: geo, material });
      });

      /* 模板网格几何体已 clone 到 parts，释放原几何体（材质仍被 InstancedMesh 复用，不释放） */
      template.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).geometry.dispose();
      });

      const result: TreeTemplate = { parts };
      this.templateCache.set(url, result);
      return result;
    } catch (err) {
      console.warn(`[ThreeDTreeController] 加载树模板失败 (${url}):`, err);
      return null;
    }
  }

  /** 用模板几何体为每棵树写入实例矩阵，构建 InstancedMesh */
  private buildInstanced(type: number, template: TreeTemplate, items: ThreeDTreeModel[]): void {
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
    this.groups.set(type, { items, positions, meshes });
  }

  /** 按相机距离 + 视锥裁剪动态收缩实例数：只把可见的树写进实例矩阵前段并缩小 count，
   *  其余实例不再被 GPU 处理。由相机 change 触发，镜头静止时不做任何计算。 */
  private updateLod(): void {
    const cam = this.sceneService.camera;
    /* change 事件先于本帧渲染触发，相机 world 矩阵尚未刷新，需手动同步后再算视锥 */
    cam.updateMatrixWorld();
    this.projScreenMatrix.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    const camPos = cam.position;

    for (const group of this.groups.values()) {
      const items = group.items;
      let count = 0;
      for (let i = 0; i < items.length; i++) {
        const t = items[i];
        const p = group.positions[i];

        /* 距离裁剪：镜头拉远时减树 */
        if (camPos.distanceTo(p) > TREE_MAX_DISTANCE) continue;

        /* 视锥裁剪：只画视野内的树（树干中心 + 约一个树冠半径的包围球） */
        this.sphere.center.copy(p);
        this.sphere.center.y += 1;
        this.sphere.radius = 2.5 * t.scale;
        if (!this.frustum.intersectsSphere(this.sphere)) continue;

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
