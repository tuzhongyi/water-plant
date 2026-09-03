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

/** 一棵树模板：按材质合并后的几何体（每材质一个合并几何体） */
interface TreeTemplate {
  parts: { geometry: THREE.BufferGeometry; material: THREE.Material }[];
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
  /** 已创建的 InstancedMesh，用于释放资源 */
  private instanced: THREE.InstancedMesh[] = [];

  private loaded = false;
  private loading = false;
  private visible = false;

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
        if (template) this.buildInstanced(template, items);
      }

      if (!this.root.parent) {
        this.sceneService.scene.add(this.root);
      }
      this.root.visible = this.visible;
      this.loaded = true;
      this.sceneService.requestRender();
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
  private buildInstanced(template: TreeTemplate, items: ThreeDTreeModel[]): void {
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
       * 否则相机只面向部分树时整组会被错误剔除 */
      im.frustumCulled = false;

      this.instanced.push(im);
      this.root.add(im);
    }
  }

  /* ---- dispose ---- */

  dispose(): void {
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
    this.templateCache.clear();
    this.loaded = false;
    this.loading = false;
    this.visible = false;
  }
}
