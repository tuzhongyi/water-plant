import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  input,
  NgZone,
  OnDestroy,
  output,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/Addons.js';
import { IIdNameModel } from '../../data-core/models/interface/model.interface';
import { MarkerController } from './business/controllers/marker.controller';
import { InternalModelState, ModelController } from './business/controllers/model.controller';
import {
  CameraEntity,
  ModelEntry,
  ModelTransformConfig,
  ModelViewerModel,
  RenderSettings,
  SceneCamera,
  StandbyClickArgs,
  Vec3,
} from './business/models/types';
import { ColorsService } from './business/services/colors.service';
import { ConfigService } from './business/services/config.service';
import { EdgesService } from './business/services/edges.service';
import { ModelService } from './business/services/model.service';
import { SceneService } from './business/services/scene.service';
import { StateService } from './business/services/state.service';

@Component({
  selector: 'hw-3d',
  imports: [],
  templateUrl: './three-dimension.html',
  styleUrl: './three-dimension.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ModelController, MarkerController],
})
export class ThreeDimensionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  standby = input<IIdNameModel>();
  /* ---- Inputs ---- */
  models = input<ModelViewerModel[]>([]);
  sceneCameras = input<SceneCamera[]>([]);
  /** 外部触发 — 摄像机 45° 俯视适配全部模型 */
  fitView = input<EventEmitter<void>>();
  /** 外部触发 — 修改指定模型的 mesh 组可见性 */
  meshVisibility = input<EventEmitter<{ id: string; visibility: Record<string, boolean> }>>();
  /** 场景摄像机标记列表 */
  cameras = input<CameraEntity[]>([]);
  /** 外部选中摄像机 ID */
  selectedCameraId = input<string | null>(null);
  /** 是否允许移动摄像机标记 */
  camerasMovable = input<boolean>(false);
  /** marker label 显示模式: 'always' 常显, 'hover' 仅悬停/聚焦时显示 */
  markerLabelMode = input<'always' | 'hover'>('hover');
  /** 垂直旋转角度限制（度），默认 15，防止摄像机低于此角度 */
  polarLimit = input<number>(-5);

  /* ---- Outputs ---- */
  modelClick = output<string>();
  modelHover = output<string | null>();
  modelDoubleClick = output<string>();
  cameraClick = output<string>();
  blankClick = output<void>();
  keyEvent = output<{ type: 'down' | 'up'; key: string }>();
  inited = output<void>();
  /** 全部模型加载完成后触发，传出与 models() 对应的 ModelTransformConfig 列表 */
  loaded = output<ModelTransformConfig[]>();
  /** 摄像机标记选中 */
  markerClick = output<string>();
  /** 摄像机标记双击 */
  markerDblClick = output<string>();
  /** 摄像机标记位置变化 */
  markerPositionChange = output<CameraEntity>();
  /** standby 模式点击时输出坐标 */
  standbyClick = output<StandbyClickArgs>();
  /** standby 模式右键取消 */
  standbyCancel = output<void>();

  /* ---- Services ---- */
  private zone = inject(NgZone);
  private sceneService = inject(SceneService);
  private state = inject(StateService);
  private modelService = inject(ModelService);
  private colorsService = inject(ColorsService);
  private configService = inject(ConfigService);
  private edgesService = inject(EdgesService);
  private modelCtrl = inject(ModelController);
  private markerCtrl = inject(MarkerController);

  /* ---- Three.js core ---- */
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  /* ---- TransformControls ---- */
  private modelTC?: TransformControls;
  private cameraTC?: TransformControls;
  private tcEditEntry?: ModelEntry;
  private tcCameraEntry?: SceneCamera;

  /* ---- Internal state ---- */
  private hoveredId: string | null = null;
  private hoveredCamId: string | null = null;
  private cameraBBoxHelpers = new Map<string, THREE.Box3Helper>();
  private pressedKeys = new Set<string>();
  private subCamSyncAdded = false;
  private camIdCounter = 0;

  /* standby 模式：跟随鼠标的半透明图标 */
  private standbySprite?: THREE.Sprite;

  private subs = new Subscription();

  constructor() {
    effect(() => {
      const m = this.models();
      this.syncModels(m);
      this.markerCtrl.updateSceneVisibility(this.models());
      this.updateLabelVisibility();
    });
    effect(() => {
      const cams = this.cameras();
      this.markerCtrl.syncCache(cams, this.modelCtrl.sceneReady);
      this.markerCtrl.updateSceneVisibility(this.models());
      this.markerCtrl.labelMode = this.markerLabelMode();
    });
    effect(() =>
      this.markerCtrl.applySelection(
        this.selectedCameraId(),
        this.camerasMovable(),
        this.modelCtrl.sceneReady,
      ),
    );
    effect(() => {
      this.polarLimit();
      if (this.modelCtrl.sceneReady) this.applyPolarLimit();
    });
    /* standby 模式：有值时创建半透明跟随图标，无值时销毁 */
    effect(() => {
      const s = this.standby();
      if (s) {
        console.log(s);
        this.ensureStandbySprite();
      } else if (this.standbySprite) {
        this.sceneService.scene.remove(this.standbySprite);
        this.standbySprite.material.dispose();
        this.standbySprite = undefined;
        this.sceneService.renderer.domElement.style.cursor = '';
      }
    });
    /* BehaviorSubject 订阅在 bindCommands 中设置（effect 不追踪 RxJS Subject） */
  }

  /* ---- Lifecycle ---- */

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    this.sceneService.init(container, canvas);

    this.scene = this.sceneService.scene;
    this.renderer = this.sceneService.renderer;

    /* 设置垂直旋转角度限制 */
    this.applyPolarLimit();

    this.bindEvents();
    this.bindCommands();
    this.sceneService.addBeforeRender(this.camBBoxUpdate);

    /* 加载 config，完成后才允许处理模型 */
    this.configService.autoLoadModels().finally(() => {
      this.modelCtrl.sceneReady = true;
      /* config 就绪后触发一次模型同步 */
      this.syncModels(this.models());
      this.applyLoadedConfig();
      this.inited.emit();
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.disposeModelTC();
    this.disposeCameraTC();
    this.sceneService.removeBeforeRender(this.camBBoxUpdate);
    this.sceneService.removeBeforeRender(this.fixSpriteScale);
    if (this.subCamSyncAdded) {
      this.sceneService.removeBeforeRender(this.subCamSync);
    }

    /* 清理模型场景对象 */
    for (const s of this.modelCtrl.internalModels.values()) {
      this.scene.remove(s.group);
      if (s.bboxHelper) {
        this.scene.remove(s.bboxHelper);
        s.bboxHelper.dispose();
      }
    }
    this.modelCtrl.internalModels.clear();
    this.modelCtrl.loadingIds.clear();
    this.modelCtrl.sceneReady = false;
    this.modelCtrl.currentGlobalSettings = undefined;
    this.modelCtrl.initViewFitted = false;

    /* 清理摄像机 BBox */
    for (const h of this.cameraBBoxHelpers.values()) {
      this.scene.remove(h);
      h.dispose();
    }
    this.cameraBBoxHelpers.clear();

    /* 清理 marker */
    this.markerCtrl.dispose();

    /* ---- 清理 state 缓存（先清理，避免 dispose 中触发回调） ---- */
    this.state.selectedModelId$.next(null);
    this.state.hoveredModelId$.next(null);
    /* activeConfig 不清空：新实例可能先 syncModels 再 autoLoadModels，需要旧配置 */
    this.state.modelFiles$.next([]);
    this.state.sceneCameras$.next([]);
    this.state.activeSceneCameraId$.next(null);
    this.state.selectedSceneCameraId$.next(null);
    this.state.loading$.next(false);
    this.state.sceneReady$.next(false);
    this.state.editMode$.next(false);
    this.state.statusMessage$.next('');
    this.state.viewPreset$.next('medium');

    /* 清理全部 loadedModels 及其 Three.js 资源 */
    const oldEntries = this.state.loadedModels;
    this.state.loadedModels$.next(new Map());
    for (const [, entry] of oldEntries) {
      /* 先清理 depthPrePassGroup（disposeEntry 未覆盖） */
      if (entry.depthPrePassGroup) {
        entry.depthPrePassGroup.traverse((c: any) => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
        entry.wrapper.remove(entry.depthPrePassGroup);
        entry.depthPrePassGroup = undefined;
      }
      this.modelService.removeModel(entry.id);
    }

    this.sceneService.dispose();
  }

  private ensureStandbySprite(): void {
    if (this.standbySprite) return;
    const tex = new THREE.TextureLoader().load('assets/images/camera.png');
    const mat = new THREE.SpriteMaterial({
      map: tex,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.5,
    });
    this.standbySprite = new THREE.Sprite(mat);
    this.standbySprite.scale.set(5, 5, 1);
    this.standbySprite.renderOrder = 999;
    this.standbySprite.visible = false;
    this.sceneService.scene.add(this.standbySprite);
    this.sceneService.addBeforeRender(this.fixSpriteScale);
  }

  /** 固定 standby sprite 为 32px，不随距离缩放 */
  private fixSpriteScale = (): void => {
    if (!this.standbySprite?.visible) return;
    const cam = this.sceneService.camera as THREE.PerspectiveCamera;
    const dist = cam.position.distanceTo(this.standbySprite.position);
    const vFov = cam.fov * Math.PI / 180;
    const height = 2 * dist * Math.tan(vFov / 2);
    const px = height / this.renderer.domElement.clientHeight;
    const s = 32 * px;
    this.standbySprite.scale.set(s, s, 1);
  }

  private updateStandbyPosition(): void {
    if (!this.standbySprite || !this.standby()) return;
    this.raycaster.setFromCamera(this.mouse, this.sceneService.camera);
    const all = this.getAllMeshes();
    const hits = this.raycaster.intersectObjects(
      all.map((a) => a.mesh),
      false,
    );
    if (hits.length > 0) {
      this.standbySprite.position.copy(hits[0].point);
      this.standbySprite.visible = true;
    } else {
      this.standbySprite.visible = false;
    }
  }

  private applyPolarLimit(): void {
    const deg = this.polarLimit();
    const rad = (deg * Math.PI) / 180;
    this.sceneService.controls.maxPolarAngle = Math.PI / 2 + rad;
  }

  /* ---- Commands ---- */

  private bindCommands(): void {
    /* 转发 controller 事件 */
    this.subs.add(this.modelCtrl.loaded.subscribe((configs) => this.loaded.emit(configs)));
    this.subs.add(
      this.modelCtrl.asyncLoadDone.subscribe(() => {
        this.fitAllModelsInView(this.models());
        this.markerCtrl.updateSceneVisibility(this.models());
        this.updateLabelVisibility();
        if (this.modelCtrl.loadingIds.size === 0) this.modelCtrl.emitLoaded(this.models());
        console.warn(
          '[loaded完成] 摄像机场景状态:',
          JSON.stringify(this.markerCtrl.getDebugState()),
        );
      }),
    );
    this.subs.add(this.markerCtrl.markerClick.subscribe((id) => this.markerClick.emit(id)));
    this.subs.add(this.markerCtrl.markerDblClick.subscribe((id) => this.markerDblClick.emit(id)));
    this.subs.add(
      this.markerCtrl.markerPositionChange.subscribe((cam) => this.markerPositionChange.emit(cam)),
    );

    this.subs.add(
      this.state.loadModelCmd$.subscribe((c) =>
        this.doLoadModel(c.url, c.fileName).finally(() => {
          const entry = this.state.loadedModels.get(c.fileName);
          if (entry) this.modelCtrl.addToInternal(entry);
          if (this.modelCtrl.loadingIds.size === 0) this.modelCtrl.emitLoaded(this.models());
        }),
      ),
    );
    this.subs.add(this.state.removeModelCmd$.subscribe((id) => this.doRemoveModel(id)));
    this.subs.add(this.state.clearAllCmd$.subscribe(() => this.doClearAll()));
    this.subs.add(this.state.focusModelCmd$.subscribe((id) => this.doFocusModel(id)));
    this.subs.add(this.state.addSceneCameraCmd$.subscribe(() => this.doAddCamera()));
    this.subs.add(this.state.removeSceneCameraCmd$.subscribe((id) => this.doRemoveCamera(id)));
    this.subs.add(this.state.setCameraViewCmd$.subscribe((id) => this.doToggleCameraView(id)));

    /* 显示参数变化（渲染模式通过 addToInternal/applyLoadedConfig 处理） */
    this.subs.add(
      this.state.settings$.subscribe((s) => {
        if (this.modelCtrl.sceneReady) {
          this.onDisplayParamsChange(s);
          this.updateLabelVisibility();
        }
      }),
    );

    /* 选中/悬停变化 → 更新模型颜色和 hover 模式的 label */
    this.subs.add(this.state.selectedModelId$.subscribe(() => this.updateAllModelColors()));
    this.subs.add(
      this.state.hoveredModelId$.subscribe(() => {
        this.updateAllModelColors();
        this.updateLabelVisibility();
      }),
    );

    /* 选中变化 → 管理编辑模式（TransformControls） */
    this.subs.add(
      this.state.selectedModelId$.subscribe((modelId) => {
        const camId = this.state.selectedSceneCameraId$.value;
        this.onSelectionChange(modelId, camId);
      }),
    );
    this.subs.add(
      this.state.selectedSceneCameraId$.subscribe((camId) => {
        const modelId = this.state.selectedModelId;
        this.onSelectionChange(modelId, camId);
      }),
    );

    /* 变换模式变化 → 更新 TransformControls */
    this.subs.add(
      this.state.transformMode$.subscribe((mode) => {
        if (this.modelTC) this.modelTC.setMode(mode);
        if (this.cameraTC) this.cameraTC.setMode(mode);
      }),
    );

    /* 锁定状态变化 → 同步到内部状态 */
    this.subs.add(this.state.loadedModels$.subscribe(() => this.syncLockStates()));

    /* 场景摄像机变化 */
    this.subs.add(this.state.sceneCameras$.subscribe((cams) => this.onSceneCamerasChange(cams)));

    /* 外部触发 — 摄像机 45° 俯视适配全部模型 */
    if (this.fitView()) {
      this.subs.add(this.fitView()!.subscribe(() => this.fitAllModelsInView(this.models(), true)));
    }
    /* 外部触发 — 修改指定模型的 mesh 组可见性 */
    if (this.meshVisibility()) {
      this.subs.add(
        this.meshVisibility()!.subscribe(({ id, visibility }) => {
          const entry = this.state.loadedModels.get(id);
          if (entry) {
            this.modelService.setNodeVisible(entry, visibility);
            this.markerCtrl.updateSceneVisibility(this.models());
            this.fitAllModelsInView(this.models(), true);
          }
        }),
      );
    }
  }

  /** 对所有已加载模型重新应用当前颜色状态 */
  private updateAllModelColors(): void {
    const selId = this.state.selectedModelId;
    const hovId = this.state.hoveredModelId;
    this.updateModelColors(selId, hovId);
  }

  /** 根据 labelMode 和当前状态更新所有 label 的可见性 */
  private updateLabelVisibility(): void {
    const hovId = this.state.hoveredModelId;
    const show = this.state.settings.showLabels;
    for (const [, entry] of this.state.loadedModels) {
      if (!entry.labelObject) continue;
      /* 已从场景移除的模型不显示 label */
      if (!this.modelCtrl.internalModels.has(entry.id)) {
        entry.labelObject.visible = false;
        continue;
      }
      switch (entry.labelMode) {
        case 'always':
          entry.labelObject.visible = show;
          break;
        case 'hover':
          entry.labelObject.visible = show && entry.id === hovId;
          break;
        case 'never':
        default:
          entry.labelObject.visible = false;
          break;
      }
    }
  }

  /** 同步锁定状态：从 ModelEntry 复制到 InternalModelState */
  private syncLockStates(): void {
    for (const [id, entry] of this.state.loadedModels) {
      const s = this.modelCtrl.internalModels.get(id);
      if (s) s.locked = entry.locked;
    }
  }

  /* ---- DOM Events ---- */

  private bindEvents(): void {
    const c = this.sceneService.renderer.domElement;
    c.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault();
      if (this.standby()) {
        this.standbyCancel.emit();
      }
    });
    c.addEventListener('pointermove', (e: PointerEvent) => this.onPointerMove(e));
    c.addEventListener('click', (e: MouseEvent) => this.onClick(e));
    c.addEventListener('dblclick', (e: MouseEvent) => this.onDoubleClick(e));
  }

  private updateMouse(e: PointerEvent | MouseEvent): void {
    const rect = this.sceneService.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /* ---- Model sync: 从 {id, fileName, url} 元数据加载 ---- */

  private syncModels(targets: ModelViewerModel[]): void {
    this.modelCtrl.syncModels(targets);
    this.fitAllModelsInView(targets);
    if (this.modelCtrl.loadingIds.size === 0) {
      this.modelCtrl.emitLoaded(this.models());
    }
  }

  /** 筛选与当前 models() 匹配的 ModelEntry，映射为 ModelTransformConfig 并 emit */
  private fitAllModelsInView(targets: ModelViewerModel[], force = false): void {
    this.modelCtrl.fitAllModelsInView(targets, force);
  }

  private getAllMeshes(): { mesh: THREE.Mesh; modelId: string }[] {
    const r: { mesh: THREE.Mesh; modelId: string }[] = [];
    for (const [id, s] of this.modelCtrl.internalModels) {
      if (s.locked) continue;
      for (const m of s.meshes) r.push({ mesh: m, modelId: id });
    }
    return r;
  }

  /* ---- Pointer / Hover ---- */

  private onPointerMove(e: PointerEvent): void {
    this.updateMouse(e);

    /* standby 模式：光标变手型 + 半透明图标跟随 */
    if (this.standby()) {
      this.updateStandbyPosition();
      this.sceneService.renderer.domElement.style.cursor = 'grab';
      return;
    }

    /* 优先检测 marker hover */
    this.markerCtrl.handle.hover(this.raycaster, this.mouse);
    if (this.markerCtrl.hoveredId) return;

    this.raycaster.setFromCamera(this.mouse, this.sceneService.camera);
    const all = this.getAllMeshes();
    const hits = this.raycaster.intersectObjects(
      all.map((a) => a.mesh),
      false,
    );
    let newHovered: string | null = null;
    if (hits.length > 0) {
      const found = all.find((a) => a.mesh === hits[0].object);
      if (found) newHovered = found.modelId;
    }
    if (this.hoveredId !== newHovered) {
      this.hoveredId = newHovered;
      this.state.hoveredModelId$.next(newHovered);
      this.modelHover.emit(newHovered);
    }
    this.detectCameraHover();
  }

  private detectCameraHover(): void {
    const cams = this.state.sceneCameras;
    const hits = this.raycaster.intersectObjects(
      cams.map((c) => c.model),
      true,
    );
    let newH: string | null = null;
    if (hits.length > 0) {
      for (const sc of cams) {
        if (hits[0].object === sc.model || sc.model.children.includes(hits[0].object)) {
          newH = sc.id;
          break;
        }
      }
    }
    this.hoveredCamId = newH;
  }

  /* ---- Click ---- */

  private onClick(e: MouseEvent): void {
    this.updateMouse(e);

    /* standby 模式：输出点击坐标 */
    if (this.standby() && this.standbySprite?.visible) {
      const p = this.standbySprite.position;
      const all = this.getAllMeshes();
      let modelId = '';
      if (all.length > 0) {
        this.raycaster.setFromCamera(this.mouse, this.sceneService.camera);
        const hits = this.raycaster.intersectObjects(
          all.map((a) => a.mesh),
          false,
        );
        if (hits.length > 0) {
          const found = all.find((a) => a.mesh === hits[0].object);
          if (found) modelId = found.modelId;
        }
      }
      this.standbyClick.emit({ x: p.x, y: p.y, z: p.z, modelId, data: this.standby()! });
      return;
    }

    /* 优先检测 marker click */
    if (this.markerCtrl.handle.click(this.raycaster, this.mouse)) return;

    /* 非 marker 点击 → 清除聚焦 */
    this.markerCtrl.handle.clearFocus();

    this.raycaster.setFromCamera(this.mouse, this.sceneService.camera);
    const all = this.getAllMeshes();
    const hits = this.raycaster.intersectObjects(
      all.map((a) => a.mesh),
      false,
    );
    if (hits.length > 0) {
      const found = all.find((a) => a.mesh === hits[0].object);
      if (found) {
        this.state.selectedModelId$.next(found.modelId);
        this.modelClick.emit(found.modelId);
        return;
      }
    }
    const cams = this.state.sceneCameras;
    const camHits = this.raycaster.intersectObjects(
      cams.map((c) => c.model),
      true,
    );
    if (camHits.length > 0) {
      for (const sc of cams) {
        if (camHits[0].object === sc.model || sc.model.children.includes(camHits[0].object)) {
          this.state.selectedSceneCameraId$.next(sc.id);
          this.cameraClick.emit(sc.id);
          return;
        }
      }
    }
    this.state.selectedModelId$.next(null);
    this.state.selectedSceneCameraId$.next(null);
    this.blankClick.emit();
  }

  /* ---- Double click ---- */

  private onDoubleClick(e: MouseEvent): void {
    this.updateMouse(e);

    /* 优先检测 marker dblclick */
    if (this.markerCtrl.handle.dblclick(this.raycaster, this.mouse)) return;

    this.raycaster.setFromCamera(this.mouse, this.sceneService.camera);
    const all = this.getAllMeshes();
    const hits = this.raycaster.intersectObjects(
      all.map((a) => a.mesh),
      false,
    );
    if (hits.length > 0) {
      const found = all.find((a) => a.mesh === hits[0].object);
      if (found) {
        this.modelDoubleClick.emit(found.modelId);
      }
    }
  }

  /* ---- Keyboard ---- */

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (
      (e.target as HTMLElement)?.tagName === 'INPUT' ||
      (e.target as HTMLElement)?.tagName === 'TEXTAREA'
    )
      return;
    const key = e.key.toLowerCase();
    if (this.state.activeSceneCameraId$.value && ['w', 'a', 's', 'd'].includes(key)) {
      this.pressedKeys.add(key);
      e.preventDefault();
      return;
    }
    /* 编辑模式快捷键由 model-viewer 内部处理 */
    const selEntry = this.state.selectedEntry;
    if (key === 'g' && selEntry) this.enterModelEdit(selEntry);
    else if (key === 'escape') {
      this.exitModelEdit();
      this.exitCameraEdit();
    } else if ((key === 'delete' || key === 'backspace') && selEntry)
      this.doRemoveModel(selEntry.id);
    else if (key === 'f' && selEntry) this.doFocusModel(selEntry.id);
    else if (key === 'w' && this.state.editMode) this.state.transformMode$.next('translate');
    else if (key === 'e' && this.state.editMode) this.state.transformMode$.next('rotate');
    else if (key === 'r' && this.state.editMode) this.state.transformMode$.next('scale');
    this.keyEvent.emit({ type: 'down', key });
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent): void {
    this.pressedKeys.delete(e.key.toLowerCase());
    this.keyEvent.emit({ type: 'up', key: e.key.toLowerCase() });
  }

  /* ---- Display Params ---- */

  /** 配置加载完成后，将设置应用到所有已加载模型 */
  private applyLoadedConfig(): void {
    const config = this.state.activeConfig;
    for (const [, entry] of this.state.loadedModels) {
      if (!this.modelCtrl.internalModels.has(entry.id)) continue;
      /* 应用渲染模式 */
      this.edgesService.createHardEdgesForEntry(entry);
      this.edgesService.applyRenderMode(entry, this.state.renderMode);
      this.colorsService.reapplyCurrentState(entry);
      /* 应用模型变换配置（如果模型在 config 加载前就加载了） */
      const transform = config?.models?.[entry.fileName];
      if (transform) {
        this.modelService.applyTransformConfig(entry, transform);
        if (transform.locked !== undefined) entry.locked = transform.locked;
        if (transform.gizmoVisible !== undefined) entry.gizmoVisible = transform.gizmoVisible;
      }
    }
    /* 同步锁定状态到内部模型 */
    this.syncLockStates();
  }

  private onDisplayParamsChange(s: RenderSettings): void {
    if (!this.modelCtrl.sceneReady) return;
    if (s.showBBox !== undefined) {
      if (s.showBBox) {
        for (const m of this.modelCtrl.internalModels.values()) {
          if (!m.bboxHelper) this.createModelBBox(m);
        }
        for (const cam of this.state.sceneCameras) {
          if (!this.cameraBBoxHelpers.has(cam.id)) this.createCameraBBox(cam);
        }
      } else {
        for (const m of this.modelCtrl.internalModels.values()) {
          if (m.bboxHelper) {
            this.scene.remove(m.bboxHelper);
            m.bboxHelper.dispose();
            m.bboxHelper = undefined;
          }
        }
        for (const [, h] of this.cameraBBoxHelpers) {
          this.scene.remove(h);
          h.dispose();
        }
        this.cameraBBoxHelpers.clear();
      }
    }
    if (s.showGrid !== undefined) this.sceneService.setGrid(s.showGrid);
    if (s.showAxes !== undefined) this.sceneService.setAxes(s.showAxes);
  }

  /* ---- BBox helpers ---- */

  private createModelBBox(s: InternalModelState): void {
    const h = new THREE.Box3Helper(
      new THREE.Box3().setFromObject(s.group),
      new THREE.Color(0xff8800),
    );
    h.renderOrder = 999;
    this.scene.add(h);
    s.bboxHelper = h;
  }

  private createCameraBBox(cam: SceneCamera): void {
    const box = new THREE.Box3().setFromObject(cam.model);
    if (new THREE.Vector3().copy(box.max).sub(box.min).length() < 0.01) return;
    const h = new THREE.Box3Helper(box, new THREE.Color(0x07a990));
    h.renderOrder = 999;
    this.cameraBBoxHelpers.set(cam.id, h);
    this.scene.add(h);
  }

  private onSceneCamerasChange(cams: SceneCamera[]): void {
    if (!this.modelCtrl.sceneReady) return;
    const ids = new Set(cams.map((c) => c.id));
    for (const [id, h] of this.cameraBBoxHelpers) {
      if (!ids.has(id)) {
        this.scene.remove(h);
        h.dispose();
        this.cameraBBoxHelpers.delete(id);
      }
    }
    for (const cam of cams) {
      if (!cam.helper.parent) this.scene.add(cam.helper);
      if (!cam.model.parent) this.scene.add(cam.model);
    }
    const activeId = this.state.activeSceneCameraId$.value;
    if (activeId && cams.some((c) => c.id === activeId)) {
      if (!this.subCamSyncAdded) {
        this.sceneService.addBeforeRender(this.subCamSync);
        this.subCamSyncAdded = true;
      }
    } else {
      if (this.subCamSyncAdded) {
        this.sceneService.removeBeforeRender(this.subCamSync);
        this.subCamSyncAdded = false;
        this.pressedKeys.clear();
      }
    }
    if (this.state.showBBox) {
      for (const cam of cams) {
        if (!this.cameraBBoxHelpers.has(cam.id)) this.createCameraBBox(cam);
      }
    }
  }

  private camBBoxUpdate = (): void => {
    if (!this.state.showBBox) return;
    for (const cam of this.state.sceneCameras) {
      const h = this.cameraBBoxHelpers.get(cam.id);
      if (h) h.box.copy(new THREE.Box3().setFromObject(cam.model));
    }
  };

  /* ---- Sub-camera sync ---- */

  private subCamSync = (): void => {
    const activeId = this.state.activeSceneCameraId$.value;
    if (!activeId) return;
    const sc = this.state.sceneCameras.find((c) => c.id === activeId);
    if (!sc) return;
    const mc = this.sceneService.camera;
    const ctrl = this.sceneService.controls;
    sc.perspCamera.position.copy(mc.position);
    sc.perspCamera.quaternion.copy(mc.quaternion);
    sc.orthoCamera.position.copy(mc.position);
    sc.orthoCamera.quaternion.copy(mc.quaternion);
    const d = new THREE.Vector3(0, 0, -1).applyQuaternion(mc.quaternion);
    sc.perspCamera.lookAt(mc.position.clone().add(d));
    sc.orthoCamera.lookAt(mc.position.clone().add(d));
    if (mc instanceof THREE.PerspectiveCamera) {
      sc.perspCamera.fov = mc.fov;
      sc.perspCamera.updateProjectionMatrix();
    } else if (mc instanceof THREE.OrthographicCamera) {
      sc.orthoCamera.zoom = mc.zoom;
      sc.orthoCamera.updateProjectionMatrix();
    }
    sc.perspCamera.updateMatrixWorld();
    sc.orthoCamera.updateMatrixWorld();
    sc.helper.update();
    const sp = this.sceneService.wasdSpeed;
    const cd = new THREE.Vector3();
    mc.getWorldDirection(cd);
    cd.normalize();
    const r = new THREE.Vector3().crossVectors(cd, mc.up).normalize();
    if (this.pressedKeys.has('w')) {
      mc.position.addScaledVector(cd, sp);
      ctrl.target.addScaledVector(cd, sp);
    }
    if (this.pressedKeys.has('s')) {
      mc.position.addScaledVector(cd, -sp);
      ctrl.target.addScaledVector(cd, -sp);
    }
    if (this.pressedKeys.has('a')) {
      mc.position.addScaledVector(r, -sp);
      ctrl.target.addScaledVector(r, -sp);
    }
    if (this.pressedKeys.has('d')) {
      mc.position.addScaledVector(r, sp);
      ctrl.target.addScaledVector(r, sp);
    }
  };

  /* ---- Colors ---- */

  private updateModelColors(selId: string | null, hovId: string | null): void {
    for (const [id] of this.modelCtrl.internalModels) {
      const e = this.state.loadedModels.get(id);
      if (!e) continue;
      this.colorsService.applyStateColors(
        e,
        id === selId ? 'selected' : id === hovId ? 'hover' : 'normal',
      );
    }
    for (const cam of this.state.sceneCameras) {
      this.applyCameraColor(
        cam,
        cam.id === this.state.selectedSceneCameraId$.value
          ? 'selected'
          : cam.id === this.hoveredCamId
            ? 'hover'
            : 'normal',
      );
    }
  }

  private applyCameraColor(cam: SceneCamera, st: 'normal' | 'hover' | 'selected'): void {
    const c = cam.colors[st];
    const e = st === 'normal' ? 0.4 : st === 'hover' ? 0.7 : 0.6;
    cam.bodyMat.color.set(c.body);
    cam.bodyMat.emissive.set(c.body);
    cam.bodyMat.emissiveIntensity = e;
    cam.lensMat.color.set(c.lens);
    cam.lensMat.emissive.set(c.lens);
    cam.lensMat.emissiveIntensity = st === 'normal' ? 0.2 : 0.4;
    cam.vfMat.color.set(c.viewfinder);
    cam.vfMat.emissive.set(c.viewfinder);
    cam.vfMat.emissiveIntensity = st === 'normal' ? 0.2 : 0.4;
  }

  /* ---- Selection → Edit ---- */

  private onSelectionChange(modelId: string | null, camId: string | null): void {
    if (!this.modelCtrl.sceneReady) return;
    /* 摄像机编辑优先 */
    if (camId && !modelId) {
      const sc = this.state.sceneCameras.find((c) => c.id === camId);
      if (sc && this.tcCameraEntry?.id !== camId) this.enterCameraEdit(sc);
    } else if (!camId && this.tcCameraEntry) {
      this.exitCameraEdit();
    }
    /* 模型编辑 */
    if (modelId) {
      const e = this.state.loadedModels.get(modelId);
      if (e && this.tcEditEntry?.id !== modelId) {
        if (this.tcEditEntry) this.exitModelEdit();
        this.enterModelEdit(e);
      }
    } else if (!modelId && this.tcEditEntry) {
      this.exitModelEdit();
    }
  }

  /* ---- Model TransformControls ---- */

  private tcCentered = false;
  /** 保存应用 gizmo 居中时的偏移量，用于还原 */
  private tcCenterOffset = new THREE.Vector3();

  private enterModelEdit(entry: ModelEntry): void {
    if (this.tcEditEntry?.id === entry.id) return;
    if (this.tcCameraEntry) this.exitCameraEdit();
    this.tcEditEntry = entry;
    this.state.editMode$.next(true);

    /* 根据全局设置决定 gizmo 参考点 */
    if (this.state.settings.gizmoPivot === 'center') {
      this.applyGizmoCenter(entry);
    }

    this.zone.runOutsideAngular(() => {
      if (!this.modelTC) this.initModelTC();
      this.modelTC!.setMode(this.state.transformMode$.value);
      this.modelTC!.attach(entry.wrapper);
    });
    /* attach 后应用单模型的 gizmo 可见性 */
    if (this.modelTC) this.modelTC.getHelper().visible = entry.gizmoVisible;
    this.syncEditInputs(entry);
  }

  private exitModelEdit(): void {
    /* 还原 gizmo 居中的偏移 */
    if (this.tcCentered && this.tcEditEntry) {
      this.revertGizmoCenter(this.tcEditEntry);
    }
    this.tcEditEntry = undefined;
    this.state.editMode$.next(false);
    if (this.modelTC) this.modelTC.detach();
  }

  /** 偏移 wrapper 使几何中心对齐 wrapper 原点（不改变逻辑位置 editPosition） */
  private applyGizmoCenter(entry: ModelEntry): void {
    const c = entry.geoCenter;
    this.tcCenterOffset.copy(c);
    entry.wrapper.children.forEach((child) => {
      child.position.x -= c.x;
      child.position.y -= c.y;
      child.position.z -= c.z;
    });
    /* wrapper 位置偏移使模型保持在世界原位 */
    entry.wrapper.position.x += c.x;
    entry.wrapper.position.y += c.y;
    entry.wrapper.position.z += c.z;
    /* 不修改 editPosition — 它始终代表文件原点的世界位置 */
    this.tcCentered = true;
  }

  /** 还原 wrapper 偏移，从 editPosition 恢复 */
  private revertGizmoCenter(entry: ModelEntry): void {
    /* 还原子对象偏移 */
    const c = this.tcCenterOffset;
    entry.wrapper.children.forEach((child) => {
      child.position.x += c.x;
      child.position.y += c.y;
      child.position.z += c.z;
    });
    /* wrapper 位置从 editPosition 恢复 */
    entry.wrapper.position.copy(entry.editPosition);
    this.tcCentered = false;
  }

  private initModelTC(): void {
    const tc = new TransformControls(
      this.sceneService.camera,
      this.sceneService.renderer.domElement,
    );
    (tc as any).size = 0.7;
    (tc as any).addEventListener('dragging-changed', (ev: any) => {
      if (this.state.activeSceneCameraId$.value) return;
      this.sceneService.controls.enabled = !ev.value;
    });
    (tc as any).addEventListener('change', () => {
      if (!this.tcEditEntry) return;
      const g = tc.object as THREE.Group;
      if (!g) return;
      g.updateWorldMatrix(true, true);
      const wp = new THREE.Vector3();
      g.getWorldPosition(wp);
      /* 如果启用了 gizmo 居中，wrapper.worldPosition = 文件原点 + geoCenter，需要减去偏移得到文件原点位置 */
      if (this.tcCentered) {
        wp.sub(this.tcCenterOffset);
      }
      this.tcEditEntry.editPosition.copy(wp);
      this.tcEditEntry.editScale.copy(g.scale);
      this.tcEditEntry.editRotation.set(g.rotation.x, g.rotation.y, g.rotation.z);
      this.state.updateEditInputs({
        posX: wp.x,
        posY: wp.y,
        posZ: wp.z,
        scaleX: g.scale.x,
        scaleY: g.scale.y,
        scaleZ: g.scale.z,
        rotH: THREE.MathUtils.radToDeg(g.rotation.x),
        rotP: THREE.MathUtils.radToDeg(g.rotation.y),
        rotB: THREE.MathUtils.radToDeg(g.rotation.z),
      });
      this.modelService.updateBBox(this.tcEditEntry);
    });
    this.sceneService.overlayScene.add(tc.getHelper());
    tc.getHelper().traverse((c: any) => {
      if (c.material) {
        c.renderOrder = Infinity;
        c.material.depthTest = false;
        c.material.depthWrite = false;
      }
    });
    this.modelTC = tc;
  }

  private disposeModelTC(): void {
    if (!this.modelTC) return;
    this.modelTC.detach();
    this.sceneService.overlayScene.remove(this.modelTC.getHelper());
    this.modelTC.dispose();
    this.modelTC = undefined;
  }

  /* ---- Camera TransformControls ---- */

  private enterCameraEdit(sc: SceneCamera): void {
    if (this.tcCameraEntry?.id === sc.id) return;
    if (this.tcEditEntry) this.exitModelEdit();
    this.tcCameraEntry = sc;
    this.state.editMode$.next(true);
    this.zone.runOutsideAngular(() => {
      if (!this.cameraTC) this.initCameraTC();
      this.cameraTC!.setMode(this.state.transformMode$.value);
      this.cameraTC!.attach(sc.model);
    });
  }

  private exitCameraEdit(): void {
    this.tcCameraEntry = undefined;
    this.state.editMode$.next(false);
    if (this.cameraTC) this.cameraTC.detach();
  }

  private initCameraTC(): void {
    const tc = new TransformControls(
      this.sceneService.camera,
      this.sceneService.renderer.domElement,
    );
    (tc as any).size = 0.7;
    (tc as any).addEventListener('dragging-changed', (ev: any) => {
      if (this.state.activeSceneCameraId$.value) return;
      this.sceneService.controls.enabled = !ev.value;
    });
    (tc as any).addEventListener('change', () => {
      if (!this.tcCameraEntry) return;
      const m = tc.object;
      m.updateWorldMatrix(true, true);
      const wp = new THREE.Vector3();
      m.getWorldPosition(wp);
      this.tcCameraEntry.perspCamera.position.copy(wp);
      this.tcCameraEntry.orthoCamera.position.copy(wp);
      this.tcCameraEntry.perspCamera.quaternion.copy(m.quaternion);
      this.tcCameraEntry.orthoCamera.quaternion.copy(m.quaternion);
      this.tcCameraEntry.perspCamera.updateMatrixWorld();
      this.tcCameraEntry.perspCamera.updateProjectionMatrix();
      this.tcCameraEntry.orthoCamera.updateMatrixWorld();
      this.tcCameraEntry.orthoCamera.updateProjectionMatrix();
      this.tcCameraEntry.helper.update();
    });
    this.sceneService.overlayScene.add(tc.getHelper());
    tc.getHelper().traverse((c: any) => {
      if (c.material) {
        c.renderOrder = Infinity;
        c.material.depthTest = false;
        c.material.depthWrite = false;
      }
    });
    this.cameraTC = tc;
  }

  private disposeCameraTC(): void {
    if (!this.cameraTC) return;
    this.cameraTC.detach();
    this.sceneService.overlayScene.remove(this.cameraTC.getHelper());
    this.cameraTC.dispose();
    this.cameraTC = undefined;
  }

  private syncEditInputs(entry: ModelEntry): void {
    /* 始终读取 editPosition（文件原点世界位置），避免 gizmo 居中时显示偏移值 */
    const p = entry.editPosition;
    const s = entry.editScale;
    const r = entry.editRotation;
    this.state.updateEditInputs({
      posX: p.x,
      posY: p.y,
      posZ: p.z,
      scaleX: s.x,
      scaleY: s.y,
      scaleZ: s.z,
      rotH: THREE.MathUtils.radToDeg(r.x),
      rotP: THREE.MathUtils.radToDeg(r.y),
      rotB: THREE.MathUtils.radToDeg(r.z),
    });
  }

  /* ---- Command handlers ---- */

  private doFocusModel(id: string): void {
    const e = this.state.loadedModels.get(id);
    if (!e) return;
    const bb = new THREE.Box3().setFromObject(e.wrapper);
    const ctr = new THREE.Vector3();
    bb.getCenter(ctr);
    const sz = new THREE.Vector3();
    bb.getSize(sz);
    const d = Math.max(sz.x, sz.y, sz.z, 0.1) * 2.5;
    const cam = this.sceneService.camera;
    const ctrl = this.sceneService.controls;
    cam.position.copy(
      ctr
        .clone()
        .addScaledVector(new THREE.Vector3().subVectors(cam.position, ctrl.target).normalize(), d),
    );
    ctrl.target.copy(ctr);
    ctrl.update();
  }

  private doRemoveModel(id: string): void {
    /* 从场景中移除 wrapper */
    const s = this.modelCtrl.internalModels.get(id);
    if (s) {
      this.scene.remove(s.group);
      if (s.bboxHelper) {
        this.scene.remove(s.bboxHelper);
        s.bboxHelper.dispose();
      }
      this.modelCtrl.internalModels.delete(id);
    }
    this.modelService.removeModel(id);
  }

  private async doLoadModel(url: string, fileName: string, position?: Vec3): Promise<void> {
    this.state.loading$.next(true);
    this.state.statusMessage$.next(`正在加载: ${fileName}...`);
    const entry = await this.modelService.loadModel(url, fileName);
    if (entry) {
      if (position) {
        /* 直接使用传入的位置信息，其他属性使用默认值 */
        entry.editPosition.set(position.x, position.y, position.z);
        this.modelService.applyTransform(entry);
      } else {
        /* 从已加载的 config 中查找对应的变换配置 */
        const config = this.state.activeConfig;
        const transform = config?.models?.[fileName];
        if (transform) {
          this.modelService.applyTransformConfig(entry, transform);
          /* 恢复材质颜色 */
          if (transform.materialColors) {
            const actualNames = new Set(this.colorsService.getMaterials(entry).map((m) => m.name));
            for (const [matName, state] of Object.entries(transform.materialColors)) {
              if (actualNames.has(matName)) entry.materialColors.set(matName, { ...state });
            }
          }
          /* 恢复 mesh 可见性 */
          if (transform.meshVisibility) {
            this.modelService.setNodeVisible(entry, transform.meshVisibility);
          }
          /* 恢复 label 设置 */
          if (transform.label !== undefined) entry.label = transform.label;
          if (transform.labelMode !== undefined) entry.labelMode = transform.labelMode;
          if (transform.labelPerHeight !== undefined)
            entry.labelPerHeight = transform.labelPerHeight;
          if (transform.labelFontSize !== undefined) entry.labelFontSize = transform.labelFontSize;
          /* 恢复锁定状态 */
          if (transform.locked !== undefined) entry.locked = transform.locked;
          if (transform.gizmoVisible !== undefined) entry.gizmoVisible = transform.gizmoVisible;
          this.modelService.updateLabel(entry);
        }
      }
      /* 应用颜色 */
      this.colorsService.applyStateColors(entry, 'normal');
      this.state.statusMessage$.next(`已加载: ${fileName}`);
    } else {
      this.state.statusMessage$.next(`加载失败: ${fileName}`);
    }
    this.state.loading$.next(false);
  }

  private doClearAll(): void {
    for (const id of Array.from(this.state.loadedModels.keys())) this.doRemoveModel(id);
    this.state.statusMessage$.next('已清空所有模型');
  }

  private doToggleCameraView(id: string): void {
    const sc = this.state.sceneCameras.find((c) => c.id === id);
    if (!sc) return;
    const ok = this.sceneService.toggleCameraView(sc.camera);
    this.state.statusMessage$.next(ok ? `已切换到: ${sc.name}` : '已切回主摄像机');
  }

  private doAddCamera(): void {
    const {
      camera: cam,
      orthoCamera,
      helper,
      model,
      bodyMat,
      lensMat,
      vfMat,
    } = this.sceneService.createCameraObject();
    this.scene.add(helper);
    this.scene.add(model);
    const id = 'cam_' + ++this.camIdCounter;
    const dc = {
      normal: { body: '#07a990', lens: '#1a1a1a', viewfinder: '#1a1a1a' },
      hover: { body: '#17f1c6', lens: '#333333', viewfinder: '#333333' },
      selected: { body: '#0adba8', lens: '#2a2a2a', viewfinder: '#2a2a2a' },
    };
    this.state.addSceneCamera({
      id,
      name: `Camera ${this.camIdCounter}`,
      camera: cam,
      perspCamera: cam,
      orthoCamera,
      isOrtho: false,
      helper,
      model,
      colors: dc,
      bodyMat,
      lensMat,
      vfMat,
    });
    this.state.selectedSceneCameraId$.next(id);
    this.state.statusMessage$.next(`已添加: Camera ${this.camIdCounter}`);
  }

  private doRemoveCamera(id: string): void {
    const sc = this.state.sceneCameras.find((c) => c.id === id);
    if (!sc) return;
    if (this.state.activeSceneCameraId$.value === id) {
      this.sceneService.restoreMainCamView();
      this.state.activeSceneCameraId$.next(null);
    }
    this.scene.remove(sc.helper);
    sc.helper.dispose();
    this.scene.remove(sc.model);
    sc.model.traverse((c: any) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
    this.state.removeSceneCamera(id);
    if (this.state.selectedSceneCameraId$.value === id)
      this.state.selectedSceneCameraId$.next(null);
  }
}
