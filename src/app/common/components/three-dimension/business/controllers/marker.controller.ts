import { EventEmitter, Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/Addons.js';
import { CameraEntity, ModelViewerModel } from '../models/types';
import { ColorsService } from '../services/colors.service';
import { SceneService } from '../services/scene.service';
import { StateService } from '../services/state.service';

/** 标记缓存项 */
interface MarkerCache {
  data: CameraEntity;
  sprite: THREE.Sprite;
  label: THREE.Sprite;
  /** 是否在场景中 */
  inScene: boolean;
}

@Injectable()
export class MarkerController {
  private sceneService = inject(SceneService);
  private state = inject(StateService);
  private colorsService = inject(ColorsService);

  /** 总缓存：所有通过 cameras 输入传入的标记 */
  private cache = new Map<string, MarkerCache>();
  private texNormal?: THREE.Texture;
  private texHover?: THREE.Texture;
  hoveredId: string | null = null;
  private tc?: TransformControls;
  private labelUpdateRegistered = false;

  /* 事件 */
  markerClick = new EventEmitter<string>();
  markerDblClick = new EventEmitter<string>();
  markerPositionChange = new EventEmitter<CameraEntity>();

  /* ---- 纹理 ---- */
  private ensureTextures(): void {
    if (this.texNormal) return;
    const loader = new THREE.TextureLoader();
    this.texNormal = loader.load('assets/images/camera.png');
    this.texHover = loader.load('assets/images/camera_hover.png');
  }

  /* ================================================================
     Layer 1: 缓存同步 — cameras 变化时增删缓存
     ================================================================ */
  syncCache(cameras: CameraEntity[], sceneReady: boolean): void {
    if (!sceneReady) return;
    this.ensureTextures();
    const targetIds = new Set(cameras.map((c) => c.id));

    /* 移除不在 cameras 中的缓存 */
    for (const [id, item] of this.cache) {
      if (!targetIds.has(id)) {
        if (item.inScene) this.removeFromScene(item);
        item.sprite.material.dispose();
        item.label.material.dispose();
        (item.label.material as THREE.SpriteMaterial).map?.dispose();
        this.cache.delete(id);
      }
    }

    /* 新增/更新缓存 */
    for (const cam of cameras) {
      let item = this.cache.get(cam.id);
      if (!item) {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texNormal!, depthTest: false, depthWrite: false }));
        sprite.name = `marker_${cam.id}`;
        sprite.userData['markerId'] = cam.id;
        sprite.scale.set(5, 5, 1);
        sprite.renderOrder = 999;
        const label = this.createLabel(cam);
        item = { data: cam, sprite, label, inScene: false };
        this.cache.set(cam.id, item);
      }
      item.data = cam;
      item.sprite.position.set(cam.position.x, cam.position.y, cam.position.z);
      item.label.position.copy(item.sprite.position);
      item.label.visible = false;
    }

    if (!this.labelUpdateRegistered) {
      this.sceneService.addBeforeRender(this.updateLabelPositions);
      this.labelUpdateRegistered = true;
    }
  }

  /* ================================================================
     Layer 2: 场景可见性 — models 变化时按 modelId/meshId 筛选
     ================================================================ */
  updateSceneVisibility(models: ModelViewerModel[]): void {
    const modelIds = new Set(models.map((m) => m.id));

    for (const [, item] of this.cache) {
      const cam = item.data;
      let shouldShow = modelIds.has(cam.modelId);
      if (shouldShow && cam.meshId) {
        const entry = this.state.loadedModels.get(cam.modelId);
        shouldShow = entry ? this.colorsService.getMeshVisible(entry, cam.meshId) : false;
      }

      if (shouldShow && !item.inScene) {
        this.addToScene(item);
      } else if (!shouldShow && item.inScene) {
        this.removeFromScene(item);
      }
    }
  }

  private addToScene(item: MarkerCache): void {
    this.sceneService.scene.add(item.sprite);
    this.sceneService.scene.add(item.label);
    item.inScene = true;
  }

  private removeFromScene(item: MarkerCache): void {
    this.sceneService.scene.remove(item.sprite);
    this.sceneService.scene.remove(item.label);
    /* 如果正在 hover 这个标记，清除 hover 状态 */
    if (this.hoveredId === item.data.id) {
      this.hoveredId = null;
      this.sceneService.renderer.domElement.style.cursor = '';
    }
    item.inScene = false;
  }

  /* ---- 标签 ---- */
  private createLabel(cam: CameraEntity): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const fontSize = 32;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const tw = ctx.measureText(cam.name).width;
    const pad = 8;
    canvas.width = tw + pad * 2;
    canvas.height = fontSize + pad * 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cam.name, canvas.width / 2, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.name = `marker_label_${cam.id}`;
    sprite.scale.set(4, 4 / (canvas.width / canvas.height), 1);
    sprite.renderOrder = 999;
    return sprite;
  }

  private updateLabelPositions = (): void => {
    const cam = this.sceneService.camera;
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion).normalize();
    for (const [, item] of this.cache) {
      if (!item.inScene) continue;
      item.label.position.copy(item.sprite.position).addScaledVector(up, 3);
    }
  };

  /* ---- 选中 / TransformControls ---- */
  applySelection(selId: string | null, movable: boolean, sceneReady: boolean): void {
    if (!sceneReady) return;
    if (this.tc) { this.tc.detach(); this.sceneService.overlayScene.remove(this.tc as any); this.tc.dispose(); this.tc = undefined; }
    if (!selId) return;

    const item = this.cache.get(selId);
    if (!item || !item.inScene || !movable) return;

    this.tc = new TransformControls(this.sceneService.camera, this.sceneService.renderer.domElement);
    (this.tc as any).size = 0.5;
    this.tc.attach(item.sprite);
    this.tc.addEventListener('change', () => {
      const cam = item.data;
      cam.position = { x: item.sprite.position.x, y: item.sprite.position.y, z: item.sprite.position.z };
      this.markerPositionChange.emit({ ...cam });
    });
    this.sceneService.overlayScene.add(this.tc as any);
  }

  /* ---- 交互 — 只检测在场景中的标记 ---- */
  getAtMouse(raycaster: THREE.Raycaster, mouse: THREE.Vector2): string | null {
    const sprites: THREE.Sprite[] = [];
    for (const [, item] of this.cache) {
      if (item.inScene) sprites.push(item.sprite);
    }
    if (sprites.length === 0) return null;
    raycaster.setFromCamera(mouse, this.sceneService.camera);
    const hits = raycaster.intersectObjects(sprites, false);
    return hits.length > 0 ? hits[0].object.userData['markerId'] : null;
  }

  handleHover(raycaster: THREE.Raycaster, mouse: THREE.Vector2): void {
    const id = this.getAtMouse(raycaster, mouse);
    if (this.hoveredId === id) return;
    if (this.hoveredId) {
      const prev = this.cache.get(this.hoveredId);
      if (prev && prev.sprite.material instanceof THREE.SpriteMaterial) { prev.sprite.material.map = this.texNormal!; prev.sprite.material.needsUpdate = true; }
      if (prev) prev.label.visible = false;
    }
    this.hoveredId = id;
    if (id) {
      const item = this.cache.get(id);
      if (item && item.sprite.material instanceof THREE.SpriteMaterial) { item.sprite.material.map = this.texHover!; item.sprite.material.needsUpdate = true; this.sceneService.renderer.domElement.style.cursor = 'pointer'; }
      if (item) item.label.visible = true;
    } else {
      this.sceneService.renderer.domElement.style.cursor = '';
    }
  }

  handleClick(raycaster: THREE.Raycaster, mouse: THREE.Vector2): boolean {
    const id = this.getAtMouse(raycaster, mouse);
    if (id) { this.markerClick.emit(id); return true; }
    return false;
  }

  handleDblClick(raycaster: THREE.Raycaster, mouse: THREE.Vector2): boolean {
    const id = this.getAtMouse(raycaster, mouse);
    if (id) { this.markerDblClick.emit(id); return true; }
    return false;
  }

  /** 调试：获取所有标记的场景状态 */
  getDebugState(): { id: string; modelId: string; meshId?: string; inScene: boolean }[] {
    const r: { id: string; modelId: string; meshId?: string; inScene: boolean }[] = [];
    for (const [, item] of this.cache) {
      r.push({ id: item.data.id, modelId: item.data.modelId, meshId: item.data.meshId, inScene: item.inScene });
    }
    return r;
  }

  /* ---- 清理 ---- */
  dispose(): void {
    for (const [, item] of this.cache) {
      if (item.inScene) this.removeFromScene(item);
      item.sprite.material.dispose();
      item.label.material.dispose();
      (item.label.material as THREE.SpriteMaterial).map?.dispose();
    }
    this.cache.clear();
    if (this.labelUpdateRegistered) { this.sceneService.removeBeforeRender(this.updateLabelPositions); this.labelUpdateRegistered = false; }
    if (this.tc) { this.tc.detach(); this.sceneService.overlayScene.remove(this.tc as any); this.tc.dispose(); this.tc = undefined; }
  }
}
