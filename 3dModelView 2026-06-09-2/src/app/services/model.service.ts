import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { SceneService } from './scene.service';
import { StateService } from './state.service';
import { EdgesService } from './edges.service';
import { ColorsService } from './colors.service';
import { ModelEntry, ModelTransformConfig } from '../models/types';
import { DEFAULT_MODEL_COLORS } from '../models/constants';

@Injectable({ providedIn: 'root' })
export class ModelService {
  private sceneService = inject(SceneService);
  private state = inject(StateService);
  private edgesService = inject(EdgesService);
  private colorsService = inject(ColorsService);

  private gltfLoader = new GLTFLoader();
  private fbxLoader = new FBXLoader();
  private objLoader = new OBJLoader();
  private stlLoader = new STLLoader();
  private plyLoader = new PLYLoader();
  private colladaLoader = new ColladaLoader();

  constructor() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    this.gltfLoader.setDRACOLoader(dracoLoader);
  }

  async loadModel(url: string, fileName: string, transform?: ModelTransformConfig): Promise<ModelEntry | null> {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    let group: THREE.Group;

    try {
      if (ext === 'glb' || ext === 'gltf') {
        group = await this.loadGLTF(url);
      } else if (ext === 'fbx') {
        group = await this.loadFBX(url);
      } else if (ext === 'obj') {
        group = await this.loadOBJ(url);
      } else if (ext === 'stl') {
        group = await this.loadSTL(url);
      } else if (ext === 'ply') {
        group = await this.loadPLY(url);
      } else if (ext === 'dae') {
        group = await this.loadDAE(url);
      } else {
        console.warn(`Unsupported format: ${ext}`);
        return null;
      }
    } catch (err) {
      console.error(`Failed to load ${fileName}:`, err);
      return null;
    }

    group.name = fileName;

    const bbox = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    group.position.set(-center.x, -center.y, -center.z);

    const wrapper = new THREE.Group();
    wrapper.name = 'wrapper_' + fileName;
    wrapper.add(group);

    const id = fileName;
    const allMeshes = this.collectMeshes(group);

    const entry: ModelEntry = {
      id,
      fileName,
      wrapper,
      model: group,
      allMeshes,
      bbox: new THREE.Box3().setFromObject(group),
      editPosition: new THREE.Vector3(0, 0, 0),
      editScale: new THREE.Vector3(1, 1, 1),
      editRotation: new THREE.Vector3(0, 0, 0),
      colors: { ...DEFAULT_MODEL_COLORS, normal: { ...DEFAULT_MODEL_COLORS.normal }, hover: { ...DEFAULT_MODEL_COLORS.hover }, selected: { ...DEFAULT_MODEL_COLORS.selected } },
      visible: true,
      materialColors: new Map(),
      label: fileName,
      labelVisible: true,
      locked: false,
    };

    this.colorsService.initMaterialColors(entry);

    if (transform) {
      this.applyTransformConfig(entry, transform);
    }

    this.sceneService.scene.add(wrapper);
    this.state.addLoadedModel(entry);

    /* 应用当前全局渲染模式 */
    const mode = this.state.renderMode;
    if (mode !== 'solid') {
      this.edgesService.createHardEdgesForEntry(entry);
    }
    this.edgesService.applyRenderMode(entry, mode);

    this.updateLabel(entry);

    return entry;
  }

  private collectMeshes(obj: THREE.Object3D): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    obj.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        meshes.push(c as THREE.Mesh);
      }
    });
    return meshes;
  }

  applyTransformConfig(entry: ModelEntry, cfg: ModelTransformConfig): void {
    entry.editPosition.set(cfg.position.x, cfg.position.y, cfg.position.z);
    entry.editScale.set(cfg.scale.x, cfg.scale.y, cfg.scale.z);
    entry.editRotation.set(
      THREE.MathUtils.degToRad(cfg.rotation.h),
      THREE.MathUtils.degToRad(cfg.rotation.p),
      THREE.MathUtils.degToRad(cfg.rotation.b)
    );
    if (cfg.colors) {
      entry.colors = {
        normal: { ...cfg.colors.normal },
        hover: { ...cfg.colors.hover },
        selected: { ...cfg.colors.selected },
      };
    }
    if (cfg.materialColors) {
      entry.materialColors.clear();
      for (const [matName, state] of Object.entries(cfg.materialColors)) {
        entry.materialColors.set(matName, { ...state });
      }
    }
    if (cfg.meshVisibility) {
      entry.model.traverse(c => {
        const m = c as THREE.Mesh;
        if (m.isMesh && m.name && cfg.meshVisibility![m.name] !== undefined) {
          m.visible = cfg.meshVisibility![m.name];
        }
      });
    }
    if (cfg.label !== undefined) {
      entry.label = cfg.label;
    }
    if (cfg.labelVisible !== undefined) {
      entry.labelVisible = cfg.labelVisible;
    }
    if (cfg.labelPerHeight !== undefined) {
      entry.labelPerHeight = cfg.labelPerHeight;
    }
    if (cfg.labelFontSize !== undefined) {
      entry.labelFontSize = cfg.labelFontSize;
    }
    this.applyTransform(entry);
  }

  applyTransform(entry: ModelEntry): void {
    entry.wrapper.position.copy(entry.editPosition);
    entry.wrapper.scale.copy(entry.editScale);
    entry.wrapper.rotation.set(entry.editRotation.x, entry.editRotation.y, entry.editRotation.z, 'YXZ');
  }

  updateLabel(entry: ModelEntry): void {
    if (entry.labelObject) {
      this.sceneService.scene.remove(entry.labelObject);
      (entry.labelObject as THREE.Sprite).material?.dispose();
      ((entry.labelObject as THREE.Sprite).material as THREE.SpriteMaterial)?.map?.dispose();
      entry.labelObject = undefined;
    }

    /* 用 canvas 绘制文字，生成 Sprite */
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const fontSize = 48;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const textWidth = ctx.measureText(entry.label).width;
    const padding = 16;
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding * 2;

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.fillText(entry.label, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.name = 'label_' + entry.fileName;

    /* 根据模型包围盒大小计算合适的标签尺寸 */
    const worldBBox = new THREE.Box3().setFromObject(entry.wrapper);
    const bboxSize = new THREE.Vector3();
    worldBBox.getSize(bboxSize);
    const labelWorldWidth = Math.max(bboxSize.x, 1) * 0.5;
    const aspect = canvas.width / canvas.height;
    sprite.scale.set(labelWorldWidth, labelWorldWidth / aspect, 1);

    const baseWorldHeight = labelWorldWidth / aspect;
    sprite.position.x = (worldBBox.min.x + worldBBox.max.x) / 2;
    sprite.position.z = (worldBBox.min.z + worldBBox.max.z) / 2;
    const heightOffset = entry.labelPerHeight ?? this.state.settings.labelHeight ?? 0.6;
    sprite.position.y = worldBBox.max.y + baseWorldHeight * heightOffset;
    sprite.visible = entry.labelVisible && this.state.settings.showLabels;
    sprite.renderOrder = 999;
    /* 存储 aspect 和基准高度，供 updateBBox 统一使用 */
    sprite.userData['aspect'] = aspect;
    sprite.userData['baseWorldHeight'] = baseWorldHeight;
    sprite.userData['labelFontSize'] = entry.labelFontSize;

    this.sceneService.scene.add(sprite);
    entry.labelObject = sprite;
    this.sceneService.registerLabel(sprite, aspect);
  }

  updateBBox(entry: ModelEntry): void {
    entry.bbox.setFromObject(entry.wrapper);
    if (entry.bboxHelper) {
      entry.bboxHelper.box.copy(entry.bbox);
    }
    if (entry.labelObject) {
      const wb = new THREE.Box3().setFromObject(entry.wrapper);
      entry.labelObject.position.x = (wb.min.x + wb.max.x) / 2;
      entry.labelObject.position.z = (wb.min.z + wb.max.z) / 2;
      const heightOffset = entry.labelPerHeight ?? this.state.settings.labelHeight ?? 0.6;
      /* 使用基准高度而非动态 scale.y，与 updateLabel 保持一致 */
      const baseH = (entry.labelObject as THREE.Sprite).userData['baseWorldHeight'] || entry.labelObject.scale.y;
      entry.labelObject.position.y = wb.max.y + baseH * heightOffset;
    }
  }

  removeModel(id: string): void {
    const entry = this.state.loadedModels.get(id);
    if (!entry) return;
    this.sceneService.scene.remove(entry.wrapper);
    this.disposeEntry(entry);
    this.state.removeLoadedModel(id);
  }

  private disposeEntry(entry: ModelEntry): void {
    if (entry.labelObject) {
      const sprite = entry.labelObject as THREE.Sprite;
      this.sceneService.unregisterLabel(sprite);
      this.sceneService.scene.remove(entry.labelObject);
      sprite.material?.dispose();
      (sprite.material as THREE.SpriteMaterial)?.map?.dispose();
      entry.labelObject = undefined;
    }
    entry.wrapper.traverse(c => {
      if ((c as THREE.Mesh).isMesh) {
        const mesh = c as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
    if (entry.bboxHelper) {
      entry.bboxHelper.dispose();
    }
    if (entry.edgesGroup) {
      entry.edgesGroup.traverse(c => {
        if ((c as THREE.Mesh).isMesh) {
          const m = c as THREE.Mesh;
          m.geometry?.dispose();
          (m.material as THREE.Material)?.dispose();
        }
      });
    }
  }

  /* ---- 各格式加载器 ---- */

  private loadGLTF(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(url, gltf => resolve(gltf.scene as THREE.Group), undefined, reject);
    });
  }

  private loadFBX(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(url, obj => resolve(obj as THREE.Group), undefined, reject);
    });
  }

  private loadOBJ(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.objLoader.load(url, obj => {
        const g = new THREE.Group();
        g.add(obj);
        resolve(g);
      }, undefined, reject);
    });
  }

  private loadSTL(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.stlLoader.load(url, geo => {
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x888888 }));
        const g = new THREE.Group();
        g.add(mesh);
        resolve(g);
      }, undefined, reject);
    });
  }

  private loadPLY(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.plyLoader.load(url, geo => {
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x888888 }));
        const g = new THREE.Group();
        g.add(mesh);
        resolve(g);
      }, undefined, reject);
    });
  }

  private loadDAE(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.colladaLoader.load(url, collada => {
        if (!collada) { reject(new Error('Collada load returned null')); return; }
        resolve(collada.scene as unknown as THREE.Group);
      }, undefined, reject);
    });
  }
}
