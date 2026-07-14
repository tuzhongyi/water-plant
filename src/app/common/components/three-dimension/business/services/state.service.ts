import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { DEFAULT_RENDER_SETTINGS } from '../models/constants';
import {
  EditInputs,
  ModelEntry,
  ModelFile,
  RenderMode,
  RenderSettings,
  SceneCamera,
  ThreeDimensionConfig,
} from '../models/types';

@Injectable({ providedIn: 'root' })
export class StateService {
  /* 模型列表 */
  readonly modelFiles$ = new BehaviorSubject<ModelFile[]>([]);
  readonly loadedModels$ = new BehaviorSubject<Map<string, ModelEntry>>(new Map());
  readonly loadedModelList$: Observable<ModelEntry[]> = this.loadedModels$.pipe(
    map((m) => Array.from(m.values())),
  );

  /* 选中 / 悬停 */
  readonly selectedModelId$ = new BehaviorSubject<string | null>(null);
  readonly hoveredModelId$ = new BehaviorSubject<string | null>(null);

  /* 渲染设置 */
  readonly settings$ = new BehaviorSubject<RenderSettings>({ ...DEFAULT_RENDER_SETTINGS });

  /* 编辑模式 */
  readonly editMode$ = new BehaviorSubject<boolean>(false);
  readonly editInputs$ = new BehaviorSubject<EditInputs>({
    posX: 0,
    posY: 0,
    posZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    rotH: 0,
    rotP: 0,
    rotB: 0,
  });

  /* 配置 */
  readonly activeConfig$ = new BehaviorSubject<ThreeDimensionConfig | null>(null);

  /* 状态栏消息 */
  readonly statusMessage$ = new BehaviorSubject<string>('');

  /* 视图预设 */
  readonly viewPreset$ = new BehaviorSubject<string>('medium');

  /* 场景摄像机 */
  readonly sceneCameras$ = new BehaviorSubject<SceneCamera[]>([]);
  readonly activeSceneCameraId$ = new BehaviorSubject<string | null>(null);
  readonly selectedSceneCameraId$ = new BehaviorSubject<string | null>(null);

  /* 加载状态 */
  readonly loading$ = new BehaviorSubject<boolean>(false);

  /* 场景就绪信号 */
  readonly sceneReady$ = new BehaviorSubject<boolean>(false);

  /* 编辑变换模式 */
  readonly transformMode$ = new BehaviorSubject<'translate' | 'rotate' | 'scale'>('translate');

  /* 跨组件命令通道（left-panel → model-viewer） */
  readonly loadModelCmd$ = new Subject<{ url: string; fileName: string }>();
  readonly removeModelCmd$ = new Subject<string>();
  readonly clearAllCmd$ = new Subject<void>();
  readonly focusModelCmd$ = new Subject<string>();
  readonly addSceneCameraCmd$ = new Subject<void>();
  readonly removeSceneCameraCmd$ = new Subject<string>();
  readonly setCameraViewCmd$ = new Subject<string>();
  readonly refreshModelList$ = new Subject<void>();
  /** 模型节点可见性变化 → 触发 edge/depth 几何体重建 */
  readonly visibilityChanged$ = new Subject<string>();

  get modelFiles(): ModelFile[] {
    return this.modelFiles$.value;
  }
  get loadedModels(): Map<string, ModelEntry> {
    return this.loadedModels$.value;
  }
  get selectedModelId(): string | null {
    return this.selectedModelId$.value;
  }
  get hoveredModelId(): string | null {
    return this.hoveredModelId$.value;
  }
  get settings(): RenderSettings {
    return this.settings$.value;
  }
  get editMode(): boolean {
    return this.editMode$.value;
  }
  get editInputs(): EditInputs {
    return this.editInputs$.value;
  }
  get activeConfig(): ThreeDimensionConfig | null {
    return this.activeConfig$.value;
  }

  get selectedEntry(): ModelEntry | null {
    const id = this.selectedModelId;
    return id ? (this.loadedModels.get(id) ?? null) : null;
  }

  get renderMode(): RenderMode {
    return this.settings.renderMode as RenderMode;
  }
  get thresholdAngle(): number {
    return this.settings.thresholdAngle;
  }
  get edgeLineWidth(): number {
    return this.settings.edgeLineWidth;
  }
  get solidOpacity(): number {
    return this.settings.solidOpacity;
  }
  get wfOpacity(): number {
    return this.settings.wfOpacity;
  }
  get bloomEnabled(): boolean {
    return this.settings.bloom;
  }
  get flatShading(): boolean {
    return this.settings.flatShading;
  }
  get showBBox(): boolean {
    return this.settings.showBBox;
  }
  get sceneCameras(): SceneCamera[] {
    return this.sceneCameras$.value;
  }
  get autoRotate(): boolean {
    return this.settings.autoRotate;
  }

  addLoadedModel(entry: ModelEntry): void {
    const next = new Map(this.loadedModels);
    next.set(entry.id, entry);
    this.loadedModels$.next(next);
  }

  removeLoadedModel(id: string): void {
    const next = new Map(this.loadedModels);
    next.delete(id);
    this.loadedModels$.next(next);
    if (this.selectedModelId === id) {
      this.selectedModelId$.next(null);
    }
    if (this.hoveredModelId === id) {
      this.hoveredModelId$.next(null);
    }
  }

  setModelVisibility(id: string, visible: boolean): void {
    const next = new Map(this.loadedModels);
    const entry = next.get(id);
    if (entry) {
      entry.visible = visible;
      this.loadedModels$.next(next);
    }
  }

  updateEditInputs(inputs: Partial<EditInputs>): void {
    this.editInputs$.next({ ...this.editInputs, ...inputs });
  }

  updateSettings(patch: Partial<RenderSettings>): void {
    this.settings$.next({ ...this.settings, ...patch });
  }

  addSceneCamera(cam: SceneCamera): void {
    this.sceneCameras$.next([...this.sceneCameras, cam]);
  }

  removeSceneCamera(id: string): void {
    this.sceneCameras$.next(this.sceneCameras.filter((c) => c.id !== id));
  }
}
