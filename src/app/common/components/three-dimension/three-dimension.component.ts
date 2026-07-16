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
import { firstValueFrom, Subscription } from 'rxjs';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/Addons.js';
import { MarkerController } from './business/controllers/marker.controller';
import { InternalModelState, ModelController } from './business/controllers/model.controller';
import {
  FitView,
  MarkerArgs,
  MarkerEntity,
  ModelEntry,
  ModelTransformConfig,
  ModelViewerModel,
  RenderMode,
  RenderSettings,
  StandbyClickArgs,
  Vec3,
} from './business/models/types';
import { ColorsService } from './business/services/colors.service';
import { ConfigService } from './business/services/config.service';
import { EdgesService } from './business/services/edges.service';
import { ModelService } from './business/services/model.service';
import { SceneService } from './business/services/scene.service';
import { StateService } from './business/services/state.service';
import { ThreeDimensionApiService } from './business/services/three-dimension-api.service';
import { ViewService } from './business/services/view.service';

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

  findbegin = input<EventEmitter<number>>();
  findend = output<MarkerEntity[]>();
  findstop = input<EventEmitter<void>>();
  // ── Model ────────────────────────────────────────────────
  /** 要加载和显示的模型列表，外部通过此 input 控制场景中的模型 */
  models = input<ModelViewerModel[]>([]);
  /** 渲染模式：solid=实体 / edges=线框 / overlay=覆盖 */
  renderMode = input<RenderMode>(RenderMode.overlay);
  /** 变换 Gizmo 可见性，true 时对选中的模型显示位置/旋转/缩放手柄 */
  gizmoVisible = input<boolean>(false);
  /** 摄像机视图切换：emit() 或 emit(Fit) = 45° 俯视适配，emit(Top/Left/Right) = 方向视图 */
  fitView = input<EventEmitter<FitView | void>>();
  /** 修改指定模型的 mesh 组可见性 */
  meshVisibility = input<EventEmitter<{ id: string; visibility: Record<string, boolean> }>>();
  /** 将摄像机移动到指定模型（通过 modelId） */
  moveto = input<EventEmitter<string>>();

  /** 模型左键单击 */
  modelClick = output<string>();
  /** 模型悬停/移出 */
  modelHover = output<string | null>();
  /** 模型双击 */
  modelDoubleClick = output<string>();
  /** 全部模型加载完成后触发，传出与 models() 对应的 ModelTransformConfig 列表 */
  loaded = output<ModelTransformConfig[]>();

  // ── Marker ───────────────────────────────────────────────
  /** 场景摄像机标记列表 */
  markers = input<MarkerEntity[]>([]);
  /** 外部选中摄像机 ID */
  selectedMarkerId = input<string>();
  /** 是否允许拖拽移动摄像机标记 */
  markersMovable = input<boolean>(false);
  /** marker label 显示模式: 'always' 常显, 'hover' 仅悬停/聚焦时显示 */
  markerLabelMode = input<'always' | 'hover'>('hover');

  /** 摄像机标记左键单击 */
  markerClick = output<string>();
  /** 摄像机标记双击 */
  markerDblClick = output<string>();
  /** 摄像机标记位置变化 */
  markerPositionChange = output<MarkerEntity>();

  // ── Standby ──────────────────────────────────────────────
  /** standby 模式：传入 MarkerArgs 后进入放置模式，光标跟随半透明图标 */
  standby = input<MarkerArgs>();

  /** standby 模式点击时输出放置坐标及原始 data */
  standbyClick = output<StandbyClickArgs>();
  /** standby 模式右键取消放置 */
  standbyCancel = output<void>();

  // ── Scene ────────────────────────────────────────────────
  /** 垂直旋转角度限制（度），负值允许摄像机低于水平面 */
  polarLimit = input<number>(-5);

  /** 空白区域（无模型/标记）左键单击 */
  blankClick = output<void>();
  /** 键盘事件 */
  keyEvent = output<{ type: 'down' | 'up'; key: string }>();
  /** 场景就绪信号 */
  inited = output<void>();

  /* ---- Services ---- */
  private zone = inject(NgZone);
  private sceneService = inject(SceneService);
  private state = inject(StateService);
  private modelService = inject(ModelService);
  private colorsService = inject(ColorsService);
  private configService = inject(ConfigService);
  private apiService = inject(ThreeDimensionApiService);
  private edgesService = inject(EdgesService);
  private modelCtrl = inject(ModelController);
  private markerCtrl = inject(MarkerController);
  private viewService = inject(ViewService);

  /* ---- Three.js core ---- */
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  /* ---- TransformControls ---- */
  private modelTC?: TransformControls;
  private tcEditEntry?: ModelEntry;

  /* ---- Internal state ---- */
  private hoveredId: string | null = null;
  private pressedKeys = new Set<string>();

  /* find 模式：搜索范围指示圈 */
  private findCircle: THREE.Group | null = null;
  private findActive = false;
  private findRadius = 0;
  /** 右键拖拽检测：区分右键点击（停止搜索）与右键拖拽（旋转/平移视角） */
  private rightButtonMoved = false;
  private rightButtonDownPos = { x: 0, y: 0 };
  /** 左键拖拽检测：区分左键单击（触发搜索）与左键拖拽（旋转视角） */
  private leftButtonMoved = false;
  private leftButtonDownPos = { x: 0, y: 0 };

  /* standby 模式：跟随鼠标的半透明图标 */
  private standbySprite?: THREE.Sprite;
  /** 当前 standby sprite 使用的图标 URL，用于检测变化 */
  private standbyIconUrl?: string;

  private subs = new Subscription();

  constructor() {
    effect(() => {
      const m = this.models();
      this.syncModels(m);
      this.markerCtrl.cache.visibility(this.models());
      this.updateLabelVisibility();
    });
    effect(() => {
      const cams = this.markers();
      this.markerCtrl.cache.sync(cams, this.modelCtrl.sceneReady);
      this.markerCtrl.cache.visibility(this.models());
      this.markerCtrl.labelMode = this.markerLabelMode();
    });
    effect(() =>
      this.markerCtrl.select.apply(
        this.markersMovable(),
        this.modelCtrl.sceneReady,
        this.selectedMarkerId(),
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
        this.sceneService.overlayScene.remove(this.standbySprite);
        this.standbySprite.material.dispose();
        this.standbySprite = undefined;
        this.standbyIconUrl = undefined;
        this.sceneService.renderer.domElement.style.cursor = '';
      }
    });
    /** gizmoVisible 控制模型变换 Gizmo：true 时 attach，false 时 detach */
    effect(() => {
      const visible = this.gizmoVisible();
      if (visible) {
        if (this.tcEditEntry) this.modelTC?.attach(this.tcEditEntry.wrapper);
      } else {
        this.modelTC?.detach();
      }
    });
    /** renderMode 有值时覆盖 config，无值时使用 config 中的值 */
    effect(() => {
      const rm = this.renderMode();
      if (!rm) return;
      this.state.updateSettings({ renderMode: rm });
      for (const [, entry] of this.state.loadedModels) {
        if (this.modelCtrl.internalModels.has(entry.id)) {
          this.edgesService.applyRenderMode(entry, rm);
          this.colorsService.reapplyCurrentState(entry);
        }
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

    /* 预加载 models.json → 构建 config 缓存 → 再加载 config.json */
    const mode = this.renderMode();
    firstValueFrom(this.apiService.models(mode))
      .then((modelFiles) => {
        const cache = new Map<string, ModelTransformConfig>();
        for (const f of modelFiles) {
          if (f.config && Object.keys(f.config).length > 0) {
            cache.set(f.name, f.config);
          }
        }

        this.modelCtrl.setConfigCache(cache);
      })
      .catch((err) => {
        console.warn('[ThreeDimensionComponent] models.json 预加载失败, 模型将使用默认配置:', err);
      })
      .finally(() => {
        /* 加载 config.json（settings），完成后才允许处理模型 */
        this.configService.autoLoadModels(mode).finally(() => {
          this.modelCtrl.sceneReady = true;
          const rm = this.renderMode();
          if (rm) this.state.updateSettings({ renderMode: rm });
          this.syncModels(this.models());
          this.applyLoadedConfig();
          this.inited.emit();
        });
      });
  }

  ngOnDestroy(): void {
    this.cleanupFindMode();
    this.subs.unsubscribe();
    this.disposeModelTC();
    this.sceneService.removeBeforeRender(this.fixSpriteScale);

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

    /* 清理 marker */
    this.markerCtrl.dispose();

    /* ---- 清理 state 缓存（先清理，避免 dispose 中触发回调） ---- */
    this.state.selectedModelId$.next(null);
    this.state.hoveredModelId$.next(null);
    /* activeConfig 不清空：新实例可能先 syncModels 再 autoLoadModels，需要旧配置 */
    this.state.modelFiles$.next([]);
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
    /* 从 standby MarkerArgs 的 icon 中读取 normal */
    const standbyData = this.standby();
    const iconUrl = standbyData?.icon?.normal ?? 'assets/images/camera.png';

    /* sprite 已存在：仅图标变化时更新纹理 */
    if (this.standbySprite) {
      if (this.standbyIconUrl !== iconUrl) {
        const tex = new THREE.TextureLoader().load(iconUrl);
        const mat = this.standbySprite.material as THREE.SpriteMaterial;
        if (mat.map) mat.map.dispose();
        mat.map = tex;
        mat.needsUpdate = true;
        this.standbyIconUrl = iconUrl;
      }
      return;
    }

    this.standbyIconUrl = iconUrl;
    const tex = new THREE.TextureLoader().load(iconUrl);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      depthTest: false,
      depthWrite: false,
    });
    this.standbySprite = new THREE.Sprite(mat);
    this.standbySprite.scale.set(5, 5, 1);
    this.standbySprite.renderOrder = Infinity;
    this.standbySprite.visible = false;
    this.sceneService.overlayScene.add(this.standbySprite);
    this.sceneService.addBeforeRender(this.fixSpriteScale);
  }

  /** 固定 standby sprite 为 32px，不随距离缩放 */
  private fixSpriteScale = (): void => {
    if (!this.standbySprite?.visible) return;
    const cam = this.sceneService.camera as THREE.PerspectiveCamera;
    const dist = cam.position.distanceTo(this.standbySprite.position);
    const vFov = (cam.fov * Math.PI) / 180;
    const height = 2 * dist * Math.tan(vFov / 2);
    const px = height / this.renderer.domElement.clientHeight;
    const s = 32 * px;
    this.standbySprite.scale.set(s, s, 1);
  };

  private updateStandbyPosition(): void {
    if (!this.standbySprite || !this.standby()) return;
    this.raycaster.setFromCamera(this.mouse, this.sceneService.camera);
    const all = this.getMeshesForFind();
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

  private applyCameraView(direction: FitView.Top | FitView.Left | FitView.Right): void {
    /* 计算全部可见模型的包围盒 */
    const combined = new THREE.Box3();
    for (const [, s] of this.modelCtrl.internalModels) {
      for (const mesh of s.meshes) {
        if (!mesh.visible) continue;
        combined.expandByObject(mesh);
      }
    }
    if (combined.isEmpty()) return;

    const center = new THREE.Vector3();
    combined.getCenter(center);
    const size = new THREE.Vector3();
    combined.getSize(size);
    const radius = Math.max(size.x, size.y, size.z) * 0.5;

    const cam = this.sceneService.camera as THREE.PerspectiveCamera;
    const dist = (radius / Math.tan((cam.fov * Math.PI) / 360)) * 1.5;

    /* 垂直旋转角度上限 */
    const polarMax = Math.PI / 2 + (this.polarLimit() * Math.PI) / 180;

    let pos: THREE.Vector3;
    switch (direction) {
      case FitView.Top:
        /* 俯视：正上方，polar angle = 0，必定在限制内 */
        pos = new THREE.Vector3(center.x, center.y + dist, center.z);
        break;
      case FitView.Left:
        pos = new THREE.Vector3(center.x - dist, center.y, center.z);
        break;
      case FitView.Right:
        pos = new THREE.Vector3(center.x + dist, center.y, center.z);
        break;
    }

    /* 左/右需要 clamp 到 polarMax 内：抬高摄像机使垂直角度不超标 */
    if (direction !== FitView.Top) {
      const hDist = Math.sqrt((pos.x - center.x) ** 2 + (pos.z - center.z) ** 2);
      const polarAngle = Math.atan2(hDist, pos.y - center.y);
      if (polarAngle > polarMax) {
        pos.y = center.y + hDist / Math.tan(polarMax);
      }
    }

    this.sceneService.controls.target.copy(center);
    this.viewService.animateCamera(pos, center, 800);
  }

  /* ---- Commands ---- */

  private bindCommands(): void {
    /* 转发 controller 事件 */
    this.subs.add(this.modelCtrl.loaded.subscribe((configs) => this.loaded.emit(configs)));
    this.subs.add(
      this.modelCtrl.asyncLoadDone.subscribe(() => {
        this.fitAllModelsInView(this.models());
        this.markerCtrl.cache.visibility(this.models());
        this.updateLabelVisibility();
        if (this.modelCtrl.loadingIds.size === 0) this.modelCtrl.emitLoaded(this.models());
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
        this.onSelectionChange(modelId);
      }),
    );

    /* 变换模式变化 → 更新 TransformControls */
    this.subs.add(
      this.state.transformMode$.subscribe((mode) => {
        if (this.modelTC) this.modelTC.setMode(mode);
      }),
    );

    /* 锁定状态变化 → 同步到内部状态 */
    this.subs.add(this.state.loadedModels$.subscribe(() => this.syncLockStates()));

    /** fitView：emit() 或 emit(Fit) 适配模型，emit(Top/Left/Right) 方向视图 */
    if (this.fitView()) {
      this.subs.add(
        this.fitView()!.subscribe((view) => {
          if (!this.modelCtrl.sceneReady) return;
          if (!view || view === FitView.Fit) {
            this.fitAllModelsInView(this.models(), true);
          } else {
            this.applyCameraView(view);
          }
        }),
      );
    }

    /** moveto：emit(modelId) 将场景摄像机聚焦到指定模型并选中 */
    if (this.moveto()) {
      this.subs.add(
        this.moveto()!.subscribe((modelId) => {
          if (!this.modelCtrl.sceneReady) return;
          this.state.selectedModelId$.next(modelId);
          this.doFocusModel(modelId);
        }),
      );
    }

    /* 外部触发 — 修改指定模型的 mesh 组可见性 */
    if (this.meshVisibility()) {
      this.subs.add(
        this.meshVisibility()!.subscribe(({ id, visibility }) => {
          const entry = this.state.loadedModels.get(id);
          if (entry) {
            this.modelService.setNodeVisible(entry, visibility);
            this.markerCtrl.cache.visibility(this.models());
            this.fitAllModelsInView(this.models(), true);
          }
        }),
      );
    }

    /** findbegin：emit(radius) 进入搜索模式，radius 为搜索半径（米） */
    if (this.findbegin()) {
      this.subs.add(
        this.findbegin()!.subscribe((radius) => {
          console.log(
            `[Find] 进入搜索模式, 半径: ${radius}m, 场景就绪: ${this.modelCtrl.sceneReady}`,
          );
          this.findRadius = radius;
          this.findActive = true;
          this.ensureFindCircle(radius);
        }),
      );
    }

    /** findstop：外部停止查找，行为同右键取消 */
    if (this.findstop()) {
      this.subs.add(
        this.findstop()!.subscribe(() => {
          if (this.findActive) {
            this.cleanupFindMode();
            this.findend.emit([]);
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

  /** 根据 labelMode 和当前状态更新所有 label 的可见性
   *  规则：model config 的 labelMode 为 'never' 时强制隐藏；
   *       其他值（'always'/'hover'）跟随 markerLabelMode 输入决定行为 */
  private updateLabelVisibility(): void {
    const hovId = this.state.hoveredModelId;
    const show = this.state.settings.showLabels;
    const markerMode = this.markerLabelMode();
    for (const [, entry] of this.state.loadedModels) {
      if (!entry.labelObject) continue;
      /* 已从场景移除的模型不显示 label */
      if (!this.modelCtrl.internalModels.has(entry.id)) {
        entry.labelObject.visible = false;
        continue;
      }
      if (entry.labelMode === 'never') {
        /* never 优先：无论外部如何设置都隐藏 */
        entry.labelObject.visible = false;
      } else {
        /* 其他值跟随 markerLabelMode：always=常显, hover=仅悬停时显 */
        entry.labelObject.visible = show && (markerMode === 'always' || entry.id === hovId);
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
    /* 记录按下位置，用于区分点击与拖拽视角（左键/右键） */
    c.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button === 0) {
        this.leftButtonMoved = false;
        this.leftButtonDownPos.x = e.clientX;
        this.leftButtonDownPos.y = e.clientY;
      } else if (e.button === 2) {
        this.rightButtonMoved = false;
        this.rightButtonDownPos.x = e.clientX;
        this.rightButtonDownPos.y = e.clientY;
      }
    });
    /* 按住拖动 ≥4px 视为移动视角，不触发 click/contextmenu 的业务逻辑 */
    c.addEventListener('pointermove', (e: PointerEvent) => {
      if (e.buttons & 1) {
        const dx = e.clientX - this.leftButtonDownPos.x;
        const dy = e.clientY - this.leftButtonDownPos.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          this.leftButtonMoved = true;
        }
      }
      if (e.buttons & 2) {
        const dx = e.clientX - this.rightButtonDownPos.x;
        const dy = e.clientY - this.rightButtonDownPos.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          this.rightButtonMoved = true;
        }
      }
      this.onPointerMove(e);
    });
    c.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault();
      /* 查找模式：仅纯右键点击（无拖拽）时停止搜索；右键拖拽视角不停止 */
      if (this.findActive && !this.rightButtonMoved) {
        this.cleanupFindMode();
        this.findend.emit([]);
        return;
      }
      if (this.standby() && !this.rightButtonMoved) {
        this.standbyCancel.emit();
      }
    });
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
      const entry = this.state.loadedModels.get(id);
      if (entry && !entry.selectable) continue;
      for (const m of s.meshes) r.push({ mesh: m, modelId: id });
    }
    return r;
  }

  /** 查找模式专用：不过滤 selectable，仅排除 locked。findable 由调用方按 config 判断 */
  private getMeshesForFind(): { mesh: THREE.Mesh; modelId: string }[] {
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

    /* find 模式：鼠标移动时更新搜索圈位置 */
    if (this.findActive) {
      this.updateFindCircle();
      return;
    }

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
  }

  /* ---- Click ---- */

  private onClick(e: MouseEvent): void {
    this.updateMouse(e);

    /* find 模式：左键单击（无拖拽）时搜索范围内 marker 并关闭查找 */
    if (this.findActive && !this.leftButtonMoved) {
      const results =
        this.findCircle?.visible && this.findCircle.position
          ? this.markerCtrl.markersInRadius(this.findCircle.position, this.findRadius)
          : [];
      this.cleanupFindMode();
      this.findend.emit(results);
      return;
    }

    /* 左键拖拽视角时，不触发任何点击事件（模型选中、marker 选中等） */
    if (this.leftButtonMoved) return;

    /* standby 模式：输出点击坐标（仅当命中模型的 findable=true 时触发） */
    if (this.standby() && this.standbySprite?.visible) {
      const p = this.standbySprite.position;
      const all = this.getAllMeshes();
      let modelId = '';
      let meshId = '';
      if (all.length > 0) {
        this.raycaster.setFromCamera(this.mouse, this.sceneService.camera);
        const hits = this.raycaster.intersectObjects(
          all.map((a) => a.mesh),
          false,
        );
        if (hits.length > 0) {
          const found = all.find((a) => a.mesh === hits[0].object);
          if (found) {
            const entry = this.state.loadedModels.get(found.modelId);
            const config = entry
              ? this.modelCtrl.getModelConfig(entry.fileName)
              : undefined;
            if (config?.findable !== true) return;
            modelId = found.modelId;
          }
          meshId = (hits[0].object as THREE.Mesh).name;
        }
      }
      this.standbyClick.emit({
        x: p.x,
        y: p.y,
        z: p.z,
        modelId,
        meshId,
        data: this.standby()!.data,
      });
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
    this.state.selectedModelId$.next(null);
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
    /* 编辑模式快捷键由 model-viewer 内部处理 */
    const selEntry = this.state.selectedEntry;
    if (key === 'g' && selEntry) this.enterModelEdit(selEntry);
    else if (key === 'escape') {
      this.exitModelEdit();
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
    for (const [, entry] of this.state.loadedModels) {
      if (!this.modelCtrl.internalModels.has(entry.id)) continue;
      /* 应用渲染模式 */
      this.edgesService.createHardEdgesForEntry(entry);
      this.edgesService.applyRenderMode(entry, this.state.renderMode);
      this.colorsService.reapplyCurrentState(entry);
      /* 应用模型变换配置（如果模型在 config 加载前就加载了） */
      const transform = this.modelCtrl.getModelConfig(entry.fileName);
      if (transform) {
        this.modelService.applyTransformConfig(entry, transform);
        if (transform.locked !== undefined) entry.locked = transform.locked;
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
      } else {
        for (const m of this.modelCtrl.internalModels.values()) {
          if (m.bboxHelper) {
            this.scene.remove(m.bboxHelper);
            m.bboxHelper.dispose();
            m.bboxHelper = undefined;
          }
        }
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
  }

  /* ---- Selection → Edit ---- */

  private onSelectionChange(modelId: string | null): void {
    if (!this.modelCtrl.sceneReady) return;
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
    this.tcEditEntry = entry;
    this.state.editMode$.next(true);

    /* 根据全局设置决定 gizmo 参考点 */
    if (this.state.settings.gizmoPivot === 'center') {
      this.applyGizmoCenter(entry);
    }

    this.zone.runOutsideAngular(() => {
      if (!this.modelTC) this.initModelTC();
      this.modelTC!.setMode(this.state.transformMode$.value);
      if (this.gizmoVisible()) {
        this.modelTC!.attach(entry.wrapper);
      }
    });
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
    const pos = ctr
      .clone()
      .addScaledVector(new THREE.Vector3().subVectors(cam.position, ctrl.target).normalize(), d);
    this.viewService.animateCamera(pos, ctr, 600);
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
        /* 从 modelConfigMap 中查找对应的变换配置 */
        const transform = this.modelCtrl.getModelConfig(fileName);
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

  /* ---- Find mode helpers ---- */

  /** 确保搜索圈已创建（radius 变化时重建） */
  private ensureFindCircle(radius: number): void {
    if (this.findCircle) {
      this.scene.remove(this.findCircle);
      this.disposeFindCircleObject();
    }
    this.findCircle = this.createFindCircle(radius);
    this.findCircle.visible = false;
    this.scene.add(this.findCircle);
  }

  /** 创建搜索范围指示圈（填充圆盘 + 轮廓线） */
  private createFindCircle(radius: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'find-circle';

    /* 半透明填充圆盘 */
    const discGeo = new THREE.RingGeometry(0, radius, 64);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.renderOrder = 998;
    group.add(disc);

    /* 轮廓线 */
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 0.8,
    });
    const line = new THREE.LineLoop(lineGeo, lineMat);
    line.renderOrder = 999;
    group.add(line);

    /* 中心点：标识鼠标精确位置 */
    const dotGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      depthTest: false,
      depthWrite: false,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.renderOrder = 1000;
    group.add(dot);

    /* 旋转到水平面（XZ 平面） */
    group.rotation.x = -Math.PI / 2;

    return group;
  }

  /** 更新搜索圈位置：跟随鼠标与模型的交点（仅 findable 模型响应，穿透非 findable 模型） */
  private updateFindCircle(): void {
    if (!this.findCircle) return;
    this.raycaster.setFromCamera(this.mouse, this.sceneService.camera);
    const all = this.getMeshesForFind();
    const hits = this.raycaster.intersectObjects(
      all.map((a) => a.mesh),
      false,
    );
    /* 遍历所有命中，穿透 findable=false 的模型，找到第一个 findable=true 的 */
    for (const hit of hits) {
      const found = all.find((a) => a.mesh === hit.object);
      const modelId = found?.modelId ?? '';
      const entry = modelId ? this.state.loadedModels.get(modelId) : undefined;
      const config = entry ? this.modelCtrl.getModelConfig(entry.fileName) : undefined;
      const findable = config?.findable === true;

      if (findable) {
        this.findCircle.position.copy(hit.point);
        this.findCircle.visible = true;
        return;
      }
    }
    /* 所有命中均非 findable，或没有任何命中 */
    this.findCircle.visible = false;
  }

  /** 清理搜索圈并退出查找模式 */
  private cleanupFindMode(): void {
    this.findActive = false;
    if (this.findCircle) {
      this.scene.remove(this.findCircle);
      this.disposeFindCircleObject();
    }
    if (this.sceneService.renderer) {
      this.sceneService.renderer.domElement.style.cursor = '';
    }
  }

  /** 释放搜索圈的几何体和材质 */
  private disposeFindCircleObject(): void {
    if (!this.findCircle) return;
    this.findCircle.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      } else if (child instanceof THREE.Line) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    this.findCircle = null;
  }
}
