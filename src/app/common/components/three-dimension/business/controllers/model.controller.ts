import { EventEmitter, Injectable, NgZone, inject } from '@angular/core';
import { Subject } from 'rxjs';
import * as THREE from 'three';
import {
  MaterialColorState,
  ModelEntry,
  ModelTransformConfig,
  ModelViewerModel,
  RenderSettings,
  Vec3,
} from '../models/types';
import { ColorsService } from '../services/colors.service';
import { ConfigService } from '../services/config.service';
import { EdgesService } from '../services/edges.service';
import { ModelService } from '../services/model.service';
import { SceneService } from '../services/scene.service';
import { StateService } from '../services/state.service';

export interface InternalModelState {
  id: string;
  group: THREE.Group;
  meshes: THREE.Mesh[];
  locked: boolean;
  bboxHelper?: THREE.Box3Helper;
}

@Injectable()
export class ModelController {
  private zone = inject(NgZone);
  private sceneService = inject(SceneService);
  private state = inject(StateService);
  private modelService = inject(ModelService);
  private colorsService = inject(ColorsService);
  private configService = inject(ConfigService);
  private edgesService = inject(EdgesService);

  /** 已加载模型内部状态 */
  readonly internalModels = new Map<string, InternalModelState>();
  /** 防止重复加载 */
  readonly loadingIds = new Set<string>();
  /** 场景就绪标志 */
  sceneReady = false;
  /** 当前全局渲染设置缓存 */
  currentGlobalSettings?: RenderSettings;

  /** 事件 */
  loaded = new EventEmitter<ModelTransformConfig[]>();
  /** 异步加载完成通知 */
  asyncLoadDone = new Subject<void>();
  initViewFitted = false;

  /* ---- 模型同步 ---- */

  syncModels(targets: ModelViewerModel[]): void {
    if (!this.sceneReady) return;
    const targetKeys = new Set(targets.map((m) => m.fileName));

    /* 移除不在目标列表中的模型 */
    for (const [id, s] of this.internalModels) {
      if (!targetKeys.has(id)) {
        this.sceneService.scene.remove(s.group);
        if (s.bboxHelper) {
          this.sceneService.scene.remove(s.bboxHelper);
          s.bboxHelper.dispose();
        }
        const entry = this.state.loadedModels.get(id);
        if (entry?.labelObject) entry.labelObject.visible = false;
        this.internalModels.delete(id);
      }
    }

    /* 加载/同步模型 */
    for (const model of targets) {
      const key = model.fileName;
      const entry = this.state.loadedModels.get(key);
      if (entry) {
        if (!this.internalModels.has(key)) {
          this.addToInternal(entry);
        } else {
          this.internalModels.get(key)!.locked = entry.locked;
        }
      } else if (!this.loadingIds.has(key)) {
        this.loadingIds.add(key);
        this.doLoadModel(model.url, model.fileName, model.position, model.label).finally(() => {
          this.loadingIds.delete(key);
          const e = this.state.loadedModels.get(key);
          if (e) this.addToInternal(e);
          this.asyncLoadDone.next();
        });
      }
    }

    /* 清除已不存在的选中 */
    const selId = this.state.selectedModelId;
    if (selId && !targetKeys.has(selId)) {
      this.state.selectedModelId$.next(null);
    }
  }

  /* ---- 内部状态管理 ---- */

  addToInternal(entry: ModelEntry): void {
    /* 重新加入场景时，全部 mesh 重置为可见 */
    entry.model.traverse((c) => { if ((c as THREE.Mesh).isMesh) (c as THREE.Mesh).visible = true; });
    /* 从 activeConfig 恢复 meshVisibility */
    const transform = this.state.activeConfig?.models?.[entry.fileName];
    if (transform?.meshVisibility) {
      this.modelService.setNodeVisible(entry, transform.meshVisibility);
    }

    const skipIds = new Set<number>();
    if (entry.edgesGroup) skipIds.add(entry.edgesGroup.id);
    if (entry.depthPrePassGroup) skipIds.add(entry.depthPrePassGroup.id);

    const meshes: THREE.Mesh[] = [];
    entry.wrapper.traverse((c) => {
      if (!(c as THREE.Mesh).isMesh) return;
      let p: THREE.Object3D | null = c.parent;
      while (p && p !== entry.wrapper) {
        if (skipIds.has(p.id)) return;
        p = p.parent;
      }
      meshes.push(c as THREE.Mesh);
    });

    const s: InternalModelState = { id: entry.id, group: entry.wrapper, meshes, locked: entry.locked };
    if (!entry.wrapper.parent) this.sceneService.scene.add(entry.wrapper);
    this.internalModels.set(entry.id, s);

    if (this.state.showBBox) this.createModelBBox(s);
    this.edgesService.createHardEdgesForEntry(entry);
    this.edgesService.applyRenderMode(entry, this.state.renderMode);
    this.colorsService.reapplyCurrentState(entry);

    /* 对新模型应用当前全局渲染配置 */
    if (this.currentGlobalSettings) {
      this.applyRenderModeToMeshes(s.meshes, this.currentGlobalSettings);
    }
  }

  getAllMeshes(): { mesh: THREE.Mesh; modelId: string }[] {
    const r: { mesh: THREE.Mesh; modelId: string }[] = [];
    for (const [id, s] of this.internalModels) {
      if (s.locked) continue;
      for (const m of s.meshes) r.push({ mesh: m, modelId: id });
    }
    return r;
  }

  /* ---- 异步加载 ---- */

  async doLoadModel(url: string, fileName: string, position?: Vec3, label?: string): Promise<void> {
    this.state.loading$.next(true);
    this.state.statusMessage$.next(`正在加载: ${fileName}...`);
    const entry = await this.modelService.loadModel(url, fileName);
    if (entry) {
      /* 始终从 activeConfig 查找并应用完整变换配置 */
      const config = this.state.activeConfig;
      const transform = config?.models?.[fileName];
      if (transform) {
        this.modelService.applyTransformConfig(entry, transform);
        /* position 优先级：models 输入 > config */
        if (position) {
          entry.editPosition.set(position.x, position.y, position.z);
          this.modelService.applyTransform(entry);
        }
        if (transform.materialColors) {
          const actualNames = new Set(this.colorsService.getMaterials(entry).map((m) => m.name));
          for (const [matName, state] of Object.entries(transform.materialColors)) {
            if (actualNames.has(matName)) entry.materialColors.set(matName, { ...state });
          }
        }
        if (transform.meshVisibility) {
          this.modelService.setNodeVisible(entry, transform.meshVisibility);
        }
        if (transform.label !== undefined) entry.label = transform.label;
        if (transform.labelMode !== undefined) entry.labelMode = transform.labelMode;
        if (transform.labelPerHeight !== undefined) entry.labelPerHeight = transform.labelPerHeight;
        if (transform.labelFontSize !== undefined) entry.labelFontSize = transform.labelFontSize;
        if (transform.locked !== undefined) entry.locked = transform.locked;
        /* label 优先级：model 输入 > config */
        if (label !== undefined) entry.label = label;
        this.modelService.updateLabel(entry);
      } else if (position) {
        /* 无 config 但有 position：直接应用位置 */
        entry.editPosition.set(position.x, position.y, position.z);
        this.modelService.applyTransform(entry);
      }
      this.colorsService.applyStateColors(entry, 'normal');
      this.state.statusMessage$.next(`已加载: ${fileName}`);
    } else {
      this.state.statusMessage$.next(`加载失败: ${fileName}`);
    }
    this.state.loading$.next(false);
  }

  doRemoveModel(id: string): void {
    const s = this.internalModels.get(id);
    if (s) {
      this.sceneService.scene.remove(s.group);
      if (s.bboxHelper) { this.sceneService.scene.remove(s.bboxHelper); s.bboxHelper.dispose(); }
      this.internalModels.delete(id);
    }
    this.modelService.removeModel(id);
  }

  doClearAll(): void {
    for (const id of Array.from(this.state.loadedModels.keys())) this.modelService.removeModel(id);
    this.state.statusMessage$.next('已清空所有模型');
  }

  /* ---- 聚焦 ---- */

  doFocusModel(id: string): void {
    const e = this.state.loadedModels.get(id);
    if (!e) return;
    const bb = new THREE.Box3().setFromObject(e.wrapper);
    const ctr = new THREE.Vector3(); bb.getCenter(ctr);
    const sz = new THREE.Vector3(); bb.getSize(sz);
    const d = Math.max(sz.x, sz.y, sz.z, 0.1) * 2.5;
    const cam = this.sceneService.camera;
    const ctrl = this.sceneService.controls;
    cam.position.copy(ctr.clone().addScaledVector(
      new THREE.Vector3().subVectors(cam.position, ctrl.target).normalize(), d));
    ctrl.target.copy(ctr);
    ctrl.update();
  }

  /* ---- 全局视图拟合 ---- */

  fitAllModelsInView(targets: ModelViewerModel[], force = false): void {
    if (targets.length === 0) { this.initViewFitted = false; return; }
    if (!force && this.initViewFitted) return;
    if (!force && !targets.every((m) => this.internalModels.has(m.fileName))) return;
    if (this.internalModels.size === 0) return;

    const combined = new THREE.Box3();
    for (const [, s] of this.internalModels) {
      for (const mesh of s.meshes) {
        if (!mesh.visible) continue;
        combined.expandByObject(mesh);
      }
    }
    if (combined.isEmpty()) return;

    const center = new THREE.Vector3(); combined.getCenter(center);
    const size = new THREE.Vector3(); combined.getSize(size);
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    const cam = this.sceneService.camera as THREE.PerspectiveCamera;
    const dist = radius / Math.tan(cam.fov * Math.PI / 360);
    const angle = Math.PI / 4;
    const hDist = dist * Math.cos(angle);
    const vDist = dist * Math.sin(angle);

    const targetPos = new THREE.Vector3(center.x, center.y + vDist, center.z + hDist);
    const targetLookAt = center.clone();
    const startPos = targetPos.clone().addScaledVector(
      new THREE.Vector3().subVectors(targetPos, targetLookAt).normalize(), dist * 2);
    this.animateCamera(targetPos, targetLookAt, startPos);
    this.initViewFitted = true;
  }

  private cameraAnimId = 0;

  private animateCamera(targetPos: THREE.Vector3, targetLookAt: THREE.Vector3, startPos: THREE.Vector3): void {
    const cam = this.sceneService.camera;
    const ctrl = this.sceneService.controls;
    const startLookAt = targetLookAt.clone();
    if (this.cameraAnimId) cancelAnimationFrame(this.cameraAnimId);
    const duration = 1000;
    const startTime = performance.now();

    const animate = (now: number) => {
      let t = (now - startTime) / duration;
      if (t > 1) t = 1;
      const ease = 1 - Math.pow(1 - t, 3);
      cam.position.lerpVectors(startPos, targetPos, ease);
      ctrl.target.lerpVectors(startLookAt, targetLookAt, ease);
      ctrl.update();
      if (t < 1) { this.cameraAnimId = requestAnimationFrame(animate); } else { this.cameraAnimId = 0; }
    };
    this.zone.runOutsideAngular(() => { this.cameraAnimId = requestAnimationFrame(animate); });
  }

  /* ---- BBox ---- */

  createModelBBox(s: InternalModelState): void {
    const h = new THREE.Box3Helper(new THREE.Box3().setFromObject(s.group), new THREE.Color(0xff8800));
    h.renderOrder = 999;
    this.sceneService.scene.add(h);
    s.bboxHelper = h;
  }

  updateBBox(s: InternalModelState, show: boolean): void {
    if (show) {
      if (!s.bboxHelper) this.createModelBBox(s);
    } else if (s.bboxHelper) {
      this.sceneService.scene.remove(s.bboxHelper);
      s.bboxHelper.dispose();
      s.bboxHelper = undefined;
    }
  }

  /* ---- 渲染参数 ---- */

  applyRenderModeToMeshes(meshes: THREE.Mesh[], s: RenderSettings): void {
    const isOverlay = s.renderMode === 'overlay';
    for (const mesh of meshes) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const sm = mat as THREE.MeshStandardMaterial;
        if (isOverlay) { sm.transparent = true; sm.opacity = s.solidOpacity; sm.depthWrite = !s.solidSeeThrough; }
        else { sm.transparent = false; sm.opacity = 1; sm.depthWrite = true; }
        sm.needsUpdate = true;
      }
    }
  }

  /* ---- loaded 导出 ---- */

  emitLoaded(models: ModelViewerModel[]): void {
    const targetKeys = new Set(models.map((m) => m.fileName));
    const configs = Array.from(this.state.loadedModels.values())
      .filter((e) => targetKeys.has(e.fileName))
      .map((e) => this.entryToTransformConfig(e));
    this.loaded.emit(configs);
  }

  entryToTransformConfig(entry: ModelEntry): ModelTransformConfig {
    const mc: Record<string, MaterialColorState> = {};
    for (const [n, s] of entry.materialColors) mc[n] = { ...s };
    const mv: Record<string, boolean> = {};
    entry.model.traverse((c) => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      const n = this.modelService.getNodeDisplayName(m, entry.model);
      if (!mv.hasOwnProperty(n)) mv[n] = m.visible;
    });
    return {
      name: entry.fileName,
      position: { x: entry.editPosition.x, y: entry.editPosition.y, z: entry.editPosition.z },
      scale: { x: entry.editScale.x, y: entry.editScale.y, z: entry.editScale.z },
      rotation: { h: THREE.MathUtils.radToDeg(entry.editRotation.x), p: THREE.MathUtils.radToDeg(entry.editRotation.y), b: THREE.MathUtils.radToDeg(entry.editRotation.z) },
      colors: entry.colors, materialColors: mc, meshVisibility: mv,
      label: entry.label, labelMode: entry.labelMode, labelPerHeight: entry.labelPerHeight, labelFontSize: entry.labelFontSize,
      locked: entry.locked,
    };
  }
}
