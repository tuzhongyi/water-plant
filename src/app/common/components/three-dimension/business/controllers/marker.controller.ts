import { EventEmitter, Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/Addons.js';
import {
  LabelMode,
  MarkerEntity,
  MarkerViewfieldArgs,
  ModelViewerModel,
  ViewfieldEditFlags,
  ViewfieldMode,
} from '../models/types';
import { ColorsService } from '../services/colors.service';
import { SceneService } from '../services/scene.service';
import { StateService } from '../services/state.service';

export interface MarkerTextureSet {
  normal: THREE.Texture;
  hover: THREE.Texture;
  selected: THREE.Texture;
  /** 离线图标（可选），offline=true 时使用 */
  offline?: THREE.Texture;
}

interface AlarmRing {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  /** 0~1 之间的相位偏移，用于多圈错开 */
  phaseOffset: number;
}

/** marker 视野扇形（模拟摄像机视野范围），viewfield 启用时存在 */
interface ViewfieldFan {
  group: THREE.Group;
  fill: THREE.Mesh;
  outline: THREE.Line;
  /** 角点拖拽手柄（扇形边缘），用于鼠标调整半径/张角 */
  handle: THREE.Mesh;
  /** 方向拖拽手柄（扇形弧中点），用于鼠标旋转扇形调整朝向 */
  courseHandle: THREE.Mesh;
  radius: number;
  angle: number;
  course: number;
  /** 各维度是否允许拖拽修改 */
  radiusEditable: boolean;
  angleEditable: boolean;
  courseEditable: boolean;
}

interface MarkerCache {
  data: MarkerEntity;
  sprite: THREE.Sprite;
  label: THREE.Sprite;
  inScene: boolean;
  /** 常态下的纹理集 */
  textures: MarkerTextureSet;
  /** 报警态下的纹理集（icon.alarm 存在时） */
  alarmTextures?: MarkerTextureSet;
  state: 'normal' | 'hover' | 'selected';
  /** 报警扩散动画环 */
  alarmRings?: AlarmRing[];
  /** 视野扇形 */
  fan?: ViewfieldFan;
}

/** 报警扩散环动画参数 */
const ALARM_RING_COLOR = 0xff4444;
const ALARM_RING_DURATION = 1500; // 单次脉冲周期 ms
const ALARM_RING_COUNT = 2; // 错开相位圈数
const ALARM_RING_INITIAL_OPACITY = 0.6;
/** 扩散环屏幕半径范围（像素），实际世界尺寸每帧根据相机距离动态换算 */
const ALARM_RING_MIN_RADIUS_PX = 24;
const ALARM_RING_MAX_RADIUS_PX = 96;
/** 环在 marker 上方的 Y 轴偏移（单位：米），避免被地面/模型遮挡 */
const ALARM_RING_Y_OFFSET = 0.3;

/** 视野扇形（模拟摄像机视野范围）参数 */
const VIEWFIELD_COLOR = 0x17f1c6;
const VIEWFIELD_FILL_OPACITY = 0.22;
const VIEWFIELD_LINE_OPACITY = 0.7;
/** 扇形相对 marker 的 Y 轴偏移（单位：米），避免与地面/模型 z-fighting */
const VIEWFIELD_Y_OFFSET = 0.2;
/** 扇形圆弧分段数 */
const VIEWFIELD_SEGMENTS = 64;
/** 扇形缺省半径（米）/ 缺省张角（度） */
const VIEWFIELD_DEFAULT_RADIUS = 50;
const VIEWFIELD_DEFAULT_ANGLE = 90;
/** 拖拽调整时的半径下限（米）与半张角范围（度） */
const VIEWFIELD_MIN_RADIUS = 1;
const VIEWFIELD_MIN_HALF_ANGLE_DEG = 2;
const VIEWFIELD_MAX_HALF_ANGLE_DEG = 90;
/** 拖拽手柄外观 */
const VIEWFIELD_HANDLE_RADIUS = 1.2;
const VIEWFIELD_HANDLE_COLOR = 0xffaa00;
/** 方向拖拽手柄颜色（扇形弧中点） */
const VIEWFIELD_COURSE_HANDLE_COLOR = 0x33ccff;
/** 拖拽手柄悬停高亮外观（改色 + 半透明） */
const VIEWFIELD_HANDLE_HOVER_COLOR = 0xffffff;
const VIEWFIELD_HANDLE_HOVER_OPACITY = 0.6;

@Injectable()
export class MarkerController {
  private sceneService = inject(SceneService);
  private state = inject(StateService);
  private colorsService = inject(ColorsService);

  private _cache = new Map<string, MarkerCache>();
  /** 纹理缓存：URL → Texture，避免同一 URL 重复加载 */
  private textureCache = new Map<string, THREE.Texture>();
  private textureLoader = new THREE.TextureLoader();
  hoveredId: string | null = null;
  private focusedId: string | null = null;
  private tc?: TransformControls;
  labelMode: LabelMode = LabelMode.hover;
  private labelUpdateRegistered = false;
  private alarmRingAnimating = false;
  private alarmAnimationStartTime = 0;

  /** 视野扇形显示模式：hide=不显示 / show=显示 / selected=仅选中 marker 显示 */
  private viewfieldMode: ViewfieldMode = ViewfieldMode.hide;
  /** 视野扇形各维度是否允许拖拽修改（缺省均允许） */
  private viewfieldEdit: ViewfieldEditFlags = {};
  /** 当前正在拖拽的扇形所属 marker（非空表示处于扇形编辑拖拽中） */
  private viewfieldDragItem: MarkerCache | null = null;
  /** 当前拖拽的手柄类型：corner=角点(半径/张角)、course=方向 */
  private viewfieldDragPart: 'corner' | 'course' | null = null;
  /** 当前悬停的视野扇形手柄（用于悬停高亮反馈） */
  private viewfieldHoverHandle: THREE.Mesh | null = null;
  /** 拖拽命中平面（扇形所在水平面） */
  private readonly viewfieldDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  /** 拖拽命中点（复用，避免每帧分配） */
  private readonly viewfieldDragTarget = new THREE.Vector3();

  /* 事件 */
  markerClick = new EventEmitter<string>();
  markerDblClick = new EventEmitter<string>();
  /** 选中的 marker（点击选中后触发，携带完整 marker 实体） */
  markerSelected = new EventEmitter<MarkerEntity>();
  markerPositionChange = new EventEmitter<MarkerEntity>();
  /** 视野扇形参数变化（拖拽调整后触发） */
  viewfieldChange = new EventEmitter<MarkerViewfieldArgs>();

  /* ================================================================
     sync — 缓存同步 + 场景可见性
     ================================================================ */
  cache = {
    sync: (cameras: MarkerEntity[], sceneReady: boolean): void => {
      if (!sceneReady) return;
      const targetIds = new Set(cameras.map((c) => c.id));
      for (const [id, item] of this._cache) {
        if (!targetIds.has(id)) {
          if (item.inScene) this.removeFromScene(item);
          if (item.fan) {
            this.disposeFan(item.fan);
            item.fan = undefined;
          }
          item.sprite.material.dispose();
          item.label.material.dispose();
          (item.label.material as THREE.SpriteMaterial).map?.dispose();
          this._cache.delete(id);
        }
      }
      for (const cam of cameras) {
        let item = this._cache.get(cam.id);
        if (!item) {
          const textures = this.loadTextureSet(cam.icon);
          const alarmTextures = cam.icon.alarm ? this.loadTextureSet(cam.icon.alarm) : undefined;
          const initialTex = this.resolveCurrentTexture(cam, textures, alarmTextures, 'normal');
          const mat = new THREE.SpriteMaterial({
            map: initialTex,
            depthTest: false,
            depthWrite: false,
          });
          mat.toneMapped = false;
          const sprite = new THREE.Sprite(mat);
          sprite.name = `marker_${cam.id}`;
          sprite.userData['markerId'] = cam.id;
          sprite.scale.set(5, 5, 1);
          sprite.renderOrder = 999;
          const label = this.createLabel(cam);
          item = {
            data: cam,
            sprite,
            label,
            inScene: false,
            textures,
            alarmTextures,
            state: 'normal',
          };
          this._cache.set(cam.id, item);
        } else {
          /* 更新已有 item：检测 icon / offline / alarm 变化并重新加载纹理/刷新显示 */
          const dataChanged = item.data.offline !== cam.offline || item.data.alarm !== cam.alarm;
          const iconChanged = this.iconChanged(item, cam.icon);
          if (iconChanged) {
            item.textures = this.loadTextureSet(cam.icon);
            item.alarmTextures = cam.icon.alarm ? this.loadTextureSet(cam.icon.alarm) : undefined;
          }
          item.data = cam;
          if (iconChanged || dataChanged) {
            /* 重新按优先级计算当前应显示的纹理 */
            const tex = this.resolveCurrentTexture(
              cam,
              item.textures,
              item.alarmTextures,
              item.state,
            );
            item.sprite.material.map = tex;
            (item.sprite.material as THREE.SpriteMaterial).needsUpdate = true;
          }
        }
        item.sprite.position.set(cam.position.x, cam.position.y, cam.position.z);
        item.label.position.copy(item.sprite.position);
        item.label.visible = false;
        /* 报警扩散环：alarm=true 时创建，false 时清理 */
        if (cam.alarm) {
          this.ensureAlarmRings(item);
        } else {
          this.removeAlarmRings(item);
        }
        /* 视野扇形：启用时创建/更新，禁用或参数变化时重建 */
        this.ensureFan(item);
      }
      if (!this.labelUpdateRegistered) {
        this.sceneService.addBeforeRender(this.updateLabelPositions);
        this.labelUpdateRegistered = true;
      }
    },

    visibility: (models: ModelViewerModel[]): void => {
      const modelIds = new Set(models.map((m) => m.fileName));
      for (const [, item] of this._cache) {
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
    },
  };

  /* ================================================================
     handle — 交互 + 聚焦
     ================================================================ */
  handle = {
    hover: (raycaster: THREE.Raycaster, mouse: THREE.Vector2): void => {
      const id = this.getAtMouse(raycaster, mouse);
      if (this.hoveredId === id) return;
      /* 还原上一个 hover 的 marker */
      if (this.hoveredId) {
        const prev = this._cache.get(this.hoveredId);
        if (prev) {
          this.applyMarkerState(prev);
        }
        prev!.label.visible = false;
      }
      this.hoveredId = id;
      if (id) {
        const item = this._cache.get(id);
        if (item) {
          /* offline 状态下不响应 hover 变化（始终显示 offline 图标） */
          if (!item.data.offline && item.state !== 'selected') {
            this.applyTextureByState(item, 'hover');
            item.state = 'hover';
          }
          this.sceneService.renderer.domElement.style.cursor = 'pointer';
        }
        if (this.focusedId && this.focusedId !== id) {
          const focused = this._cache.get(this.focusedId);
          if (focused) focused.label.visible = false;
        }
        if (item) item.label.visible = true;
      } else {
        this.sceneService.renderer.domElement.style.cursor = '';
        if (this.focusedId) {
          const focused = this._cache.get(this.focusedId);
          if (focused?.inScene) focused.label.visible = true;
        }
      }
    },

    click: (raycaster: THREE.Raycaster, mouse: THREE.Vector2): boolean => {
      const id = this.getAtMouse(raycaster, mouse);
      if (id) {
        /* 点击即选中：切换 focusedId + selected 纹理，并对外输出选中的 marker */
        const item = this.focus(id);
        this.markerClick.emit(id);
        if (item) this.markerSelected.emit(item.data);
        return true;
      }
      return false;
    },

    dblclick: (raycaster: THREE.Raycaster, mouse: THREE.Vector2): boolean => {
      const id = this.getAtMouse(raycaster, mouse);
      if (id) {
        this.markerDblClick.emit(id);
        return true;
      }
      return false;
    },

    clearFocus: (): void => {
      if (this.focusedId) {
        const item = this._cache.get(this.focusedId);
        if (item) {
          item.label.visible = false;
          if (item.state === 'selected') {
            this.applyTextureByState(item, 'normal');
            item.state = 'normal';
          }
        }
      }
      this.focusedId = null;
      this.refreshViewfields();
    },
  };

  /* ================================================================
     select — 选中 + 场景居中 + TransformControls
     ================================================================ */
  select = {
    apply: (movable: boolean, sceneReady: boolean, selId?: string): void => {
      if (!sceneReady) return;
      /* 清理旧的 TC */
      if (this.tc) {
        this.tc.detach();
        this.sceneService.overlayScene.remove(this.tc as any);
        this.tc.dispose();
        this.tc = undefined;
      }

      if (!selId) {
        /* 清空选中：还原上一个选中项并取消聚焦 */
        if (this.focusedId) {
          const prev = this._cache.get(this.focusedId);
          if (prev && prev.state === 'selected') {
            this.applyTextureByState(prev, 'normal');
            prev.state = 'normal';
          }
        }
        this.focusedId = null;
        this.refreshViewfields();
        return;
      }

      const item = this.focus(selId);
      if (!item) return;

      /* 平移动画，marker 居中 */
      const startPos = this.sceneService.camera.position.clone();
      const startTgt = this.sceneService.controls.target.clone();
      const endPos = startPos.clone().add(item.sprite.position.clone().sub(startTgt));
      const endTgt = item.sprite.position.clone();
      const duration = 300;
      const startTime = performance.now();
      const animate = (now: number) => {
        let t = (now - startTime) / duration;
        if (t > 1) t = 1;
        const ease = 1 - Math.pow(1 - t, 3);
        this.sceneService.camera.position.lerpVectors(startPos, endPos, ease);
        this.sceneService.controls.target.lerpVectors(startTgt, endTgt, ease);
        this.sceneService.controls.update();
        if (t < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);

      if (!movable) return;
      this.tc = new TransformControls(
        this.sceneService.camera,
        this.sceneService.renderer.domElement,
      );
      (this.tc as any).size = 0.5;
      this.tc.attach(item.sprite);
      this.tc.addEventListener('change', () => {
        const cam = item.data;
        cam.position = {
          x: item.sprite.position.x,
          y: item.sprite.position.y,
          z: item.sprite.position.z,
        };
        this.markerPositionChange.emit({ ...cam });
      });
      this.sceneService.overlayScene.add(this.tc as any);
    },
  };

  /**
   * 将指定 marker 设为选中态：还原上一个选中项，更新 focusedId、selected 纹理、label 可见性，
   * 并刷新视野扇形（selected 模式依赖选中状态）。offline 状态下保持 offline 图标不变。
   * @param id 目标 marker 的 id
   * @returns 命中且已选中的 marker 缓存，未命中返回 undefined
   */
  private focus(id: string): MarkerCache | undefined {
    /* 还原上一个选中项：取消 selected 态并恢复 normal 纹理 */
    if (this.focusedId && this.focusedId !== id) {
      const prev = this._cache.get(this.focusedId);
      if (prev && prev.state === 'selected') {
        this.applyTextureByState(prev, 'normal');
        prev.state = 'normal';
      }
    }
    const item = this._cache.get(id);
    if (!item || !item.inScene) {
      this.focusedId = null;
      this.refreshViewfields();
      return undefined;
    }
    this.focusedId = id;
    this.refreshViewfields();
    for (const [, m] of this._cache) {
      if (m.label) m.label.visible = m === item;
    }
    /* offline 状态下不改变图标；否则设置为 selected */
    if (!item.data.offline) {
      this.applyTextureByState(item, 'selected');
      item.state = 'selected';
    }
    return item;
  }

  /* ================================================================
     viewfield — 视野扇形
     ================================================================ */

  /**
   * 设置视野扇形显示模式与各维度是否允许修改，对所有已缓存 marker 生效。
   * @param mode 显示模式：hide=不显示 / show=显示 / selected=仅选中 marker 显示
   * @param edit 各维度（半径/张角/方向）是否允许修改，仅显式传 true 的维度允许，缺省均不允许
   */
  setViewfield(mode: ViewfieldMode, edit?: ViewfieldEditFlags): void {
    this.viewfieldMode = mode;
    this.viewfieldEdit = edit ?? {};
    this.refreshViewfields();
  }

  /** 解析各维度是否允许修改：仅显式传 true 的维度允许，缺省均不允许 */
  private resolveEdit(): { radius: boolean; angle: boolean; course: boolean } {
    return {
      radius: this.viewfieldEdit.radius === true,
      angle: this.viewfieldEdit.angle === true,
      course: this.viewfieldEdit.course === true,
    };
  }

  /** 判断某 marker 是否应显示视野扇形（依据显示模式 + 该 marker 的 enabled + 选中状态） */
  private viewfieldShownFor(item: MarkerCache): boolean {
    if (item.data.viewfield?.enabled !== true) return false;
    switch (this.viewfieldMode) {
      case ViewfieldMode.show:
        return true;
      case ViewfieldMode.selected:
        return item.data.id === this.focusedId;
      default:
        return false;
    }
  }

  /** 按当前显示模式刷新所有 marker 的视野扇形 */
  private refreshViewfields(): void {
    for (const [, item] of this._cache) {
      this.ensureFan(item);
    }
  }

  /* ================================================================
     debug
     ================================================================ */
  debug = {
    state: (): {
      id: string;
      modelId: string;
      meshId?: string;
      inScene: boolean;
      offline?: boolean;
      alarm: boolean;
    }[] => {
      const r: {
        id: string;
        modelId: string;
        meshId?: string;
        inScene: boolean;
        offline?: boolean;
        alarm: boolean;
      }[] = [];
      for (const [, item] of this._cache) {
        r.push({
          id: item.data.id,
          modelId: item.data.modelId,
          meshId: item.data.meshId,
          inScene: item.inScene,
          offline: item.data.offline,
          alarm: !!item.data.alarm,
        });
      }
      return r;
    },
  };

  /** 查询 marker 当前世界位置（考虑 TransformControls 拖拽后的实时位置） */
  getPosition(id: string): THREE.Vector3 | null {
    const item = this._cache.get(id);
    if (!item || !item.inScene) return null;
    return item.sprite.position.clone();
  }

  /** 查询指定位置半径内的所有 marker（XZ 平面距离，水平方向搜索） */
  markersInRadius(center: THREE.Vector3, radius: number): MarkerEntity[] {
    const results: MarkerEntity[] = [];
    for (const [, item] of this._cache) {
      if (!item.inScene) continue;
      const dx = item.sprite.position.x - center.x;
      const dz = item.sprite.position.z - center.z;
      if (Math.sqrt(dx * dx + dz * dz) <= radius) {
        results.push(item.data);
      }
    }
    return results;
  }

  /* ================================================================
     private — 报警扩散环
     ================================================================ */

  /** 为 marker 创建报警扩散动画环（已存在则跳过） */
  private ensureAlarmRings(item: MarkerCache): void {
    if (item.alarmRings && item.alarmRings.length > 0) return;
    const rings: AlarmRing[] = [];
    for (let i = 0; i < ALARM_RING_COUNT; i++) {
      /* 较厚的环，避免缩放太小时看不见 */
      const ringGeo = new THREE.RingGeometry(0.7, 1.0, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ALARM_RING_COLOR,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2; // 平铺在 XZ 平面
      ring.renderOrder = 998;
      ring.position.copy(item.sprite.position);
      ring.position.y += ALARM_RING_Y_OFFSET;
      /* 初始比例在 updateAlarmRings 首帧计算，此处设 1 作为占位 */
      ring.scale.set(1, 1, 1);
      if (item.inScene) {
        this.sceneService.overlayScene.add(ring);
      }
      rings.push({ mesh: ring, material: ringMat, phaseOffset: i / ALARM_RING_COUNT });
    }
    item.alarmRings = rings;

    /* 注册全局动画回调（仅首次） */
    if (!this.alarmRingAnimating) {
      this.alarmRingAnimating = true;
      this.alarmAnimationStartTime = performance.now();
      this.sceneService.addBeforeRender(this.updateAlarmRings);
    }
  }

  /** 移除 marker 的报警扩散环并释放资源 */
  private removeAlarmRings(item: MarkerCache): void {
    if (!item.alarmRings) return;
    for (const ring of item.alarmRings) {
      this.sceneService.overlayScene.remove(ring.mesh);
      ring.mesh.geometry.dispose();
      ring.material.dispose();
    }
    item.alarmRings = undefined;
  }

  /** 每帧更新所有报警扩散环的缩放和透明度（屏幕像素恒定） */
  private updateAlarmRings = (): void => {
    const now = performance.now();
    const cam = this.sceneService.camera;
    const renderer = this.sceneService.renderer;
    const vpHeight = renderer?.domElement?.clientHeight || 600;
    const isPerspective = cam instanceof THREE.PerspectiveCamera;

    /* 正交相机：像素→世界单位的转换系数（所有 ring 相同） */
    let orthoPxToWorld = 0;
    if (!isPerspective) {
      const frustumSize = 20;
      const viewH = frustumSize / (cam as THREE.OrthographicCamera).zoom;
      orthoPxToWorld = viewH / vpHeight;
    }

    let anyActive = false;
    for (const [, item] of this._cache) {
      if (!item.alarmRings || !item.inScene) continue;
      anyActive = true;
      for (const ring of item.alarmRings) {
        /* 计算当前脉冲周期进度 0→1 */
        const elapsed = now - this.alarmAnimationStartTime;
        const t = (elapsed / ALARM_RING_DURATION + ring.phaseOffset) % 1;

        /* 当前帧目标像素半径 */
        const targetPx =
          ALARM_RING_MIN_RADIUS_PX + t * (ALARM_RING_MAX_RADIUS_PX - ALARM_RING_MIN_RADIUS_PX);

        /* 像素 → 世界单位 */
        let worldRadius: number;
        if (isPerspective) {
          const dist = (cam as THREE.PerspectiveCamera).position.distanceTo(ring.mesh.position);
          const vFov = ((cam as THREE.PerspectiveCamera).fov * Math.PI) / 180;
          const viewH = 2 * dist * Math.tan(vFov / 2);
          worldRadius = (targetPx * viewH) / vpHeight;
        } else {
          worldRadius = targetPx * orthoPxToWorld;
        }

        ring.mesh.scale.set(worldRadius, worldRadius, 1);

        /* opacity: 前 10% 渐入，后 90% 渐出 */
        const fadeIn = Math.min(t / 0.1, 1);
        const fadeOut = 1 - Math.max(0, (t - 0.1) / 0.9);
        ring.material.opacity = ALARM_RING_INITIAL_OPACITY * fadeIn * fadeOut;

        /* 位置跟随 marker sprite，保持 Y 轴偏移 */
        ring.mesh.position.copy(item.sprite.position);
        ring.mesh.position.y += ALARM_RING_Y_OFFSET;
      }
    }
    /* 没有任何活跃报警环时注销回调 */
    if (!anyActive) {
      this.alarmRingAnimating = false;
      this.sceneService.removeBeforeRender(this.updateAlarmRings);
    }
  };

  /* ================================================================
     private — 视野扇形
     ================================================================ */

  /** 确保 marker 的视野扇形存在且参数匹配；不显示时移除。radius/angle/course 或可编辑性变化时重建。 */
  private ensureFan(item: MarkerCache): void {
    /* 按显示模式判断该 marker 是否显示扇形，不显示时移除 */
    if (!this.viewfieldShownFor(item)) {
      this.removeFan(item);
      return;
    }
    const radius = item.data.viewfield?.radius ?? VIEWFIELD_DEFAULT_RADIUS;
    const angle = item.data.viewfield?.angle ?? VIEWFIELD_DEFAULT_ANGLE;
    const course = item.data.viewfield?.course ?? 0;
    const edit = this.resolveEdit();

    if (
      item.fan &&
      item.fan.radius === radius &&
      item.fan.angle === angle &&
      item.fan.course === course &&
      item.fan.radiusEditable === edit.radius &&
      item.fan.angleEditable === edit.angle &&
      item.fan.courseEditable === edit.course
    ) {
      return;
    }

    /* 移除旧扇形 */
    if (item.fan) {
      this.sceneService.overlayScene.remove(item.fan.group);
      this.disposeFan(item.fan);
      item.fan = undefined;
    }

    this.createFan(item);
  }

  /** 移除 marker 的视野扇形并释放资源 */
  private removeFan(item: MarkerCache): void {
    if (!item.fan) return;
    this.sceneService.overlayScene.remove(item.fan.group);
    this.disposeFan(item.fan);
    item.fan = undefined;
  }

  /** 释放视野扇形的几何体与材质 */
  private disposeFan(fan: ViewfieldFan): void {
    /* 若正悬停的手柄随该扇形一起销毁，则清除悬停引用 */
    if (this.viewfieldHoverHandle === fan.handle || this.viewfieldHoverHandle === fan.courseHandle) {
      this.viewfieldHoverHandle = null;
    }
    fan.group.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry?.dispose();
        const mat = child.material as THREE.Material | undefined;
        if (mat) mat.dispose();
      }
    });
  }

  /** 创建 marker 的视野扇形（填充 + 轮廓 + 角点/方向拖拽手柄），参数取自 marker 自身数据 */
  private createFan(item: MarkerCache): void {
    const radius = item.data.viewfield?.radius ?? VIEWFIELD_DEFAULT_RADIUS;
    const angle = item.data.viewfield?.angle ?? VIEWFIELD_DEFAULT_ANGLE;
    const course = item.data.viewfield?.course ?? 0;
    const edit = this.resolveEdit();
    const segments = VIEWFIELD_SEGMENTS;

    const group = new THREE.Group();
    group.name = 'marker-viewfield';

    /* 填充：扇形三角面片（XZ 平面，局部坐标相对 marker） */
    const fillPositions = new Float32Array((segments + 2) * 3);
    const indices: number[] = [];
    for (let i = 0; i < segments; i++) indices.push(0, i + 1, i + 2);
    const fillGeo = new THREE.BufferGeometry();
    fillGeo.setAttribute('position', new THREE.BufferAttribute(fillPositions, 3));
    fillGeo.setIndex(indices);
    const fillMat = new THREE.MeshBasicMaterial({
      color: VIEWFIELD_COLOR,
      transparent: true,
      opacity: VIEWFIELD_FILL_OPACITY,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const fill = new THREE.Mesh(fillGeo, fillMat);
    fill.renderOrder = 997;
    group.add(fill);

    /* 轮廓：center → 圆弧（LineLoop 闭合回 center，形成两条半径 + 弧） */
    const outlinePositions = new Float32Array((segments + 2) * 3);
    const outlineGeo = new THREE.BufferGeometry();
    outlineGeo.setAttribute('position', new THREE.BufferAttribute(outlinePositions, 3));
    const outlineMat = new THREE.LineBasicMaterial({
      color: VIEWFIELD_COLOR,
      transparent: true,
      opacity: VIEWFIELD_LINE_OPACITY,
      depthTest: false,
      depthWrite: false,
    });
    const outline = new THREE.LineLoop(outlineGeo, outlineMat);
    outline.renderOrder = 998;
    group.add(outline);

    /* 角点拖拽手柄：位于扇形边缘角点，调整半径/张角（半径或张角至少一项可修改时显示） */
    const handleGeo = new THREE.SphereGeometry(VIEWFIELD_HANDLE_RADIUS, 12, 12);
    const handleMat = new THREE.MeshBasicMaterial({
      color: VIEWFIELD_HANDLE_COLOR,
      depthTest: false,
      depthWrite: false,
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.renderOrder = 1000;
    handle.userData['markerId'] = item.data.id;
    handle.userData['viewfieldPart'] = 'corner';
    handle.userData['baseColor'] = VIEWFIELD_HANDLE_COLOR;
    handle.visible = edit.radius || edit.angle;
    group.add(handle);

    /* 方向拖拽手柄：位于扇形弧中点，旋转扇形调整朝向（方向可修改时显示） */
    const courseHandleGeo = new THREE.SphereGeometry(VIEWFIELD_HANDLE_RADIUS, 12, 12);
    const courseHandleMat = new THREE.MeshBasicMaterial({
      color: VIEWFIELD_COURSE_HANDLE_COLOR,
      depthTest: false,
      depthWrite: false,
    });
    const courseHandle = new THREE.Mesh(courseHandleGeo, courseHandleMat);
    courseHandle.renderOrder = 1000;
    courseHandle.userData['markerId'] = item.data.id;
    courseHandle.userData['viewfieldPart'] = 'course';
    courseHandle.userData['baseColor'] = VIEWFIELD_COURSE_HANDLE_COLOR;
    courseHandle.visible = edit.course;
    group.add(courseHandle);

    item.fan = {
      group,
      fill,
      outline,
      handle,
      courseHandle,
      radius,
      angle,
      course,
      radiusEditable: edit.radius,
      angleEditable: edit.angle,
      courseEditable: edit.course,
    };
    this.refreshFanGeometry(item);

    if (item.inScene) {
      this.sceneService.overlayScene.add(group);
    }
  }

  /** 根据 fan 当前 radius/angle/course 刷新扇形几何体、手柄位置与 group 位置 */
  private refreshFanGeometry(item: MarkerCache): void {
    const fan = item.fan;
    if (!fan) return;

    const radius = fan.radius;
    const halfAngle = THREE.MathUtils.degToRad(fan.angle / 2);
    const courseRad = THREE.MathUtils.degToRad(fan.course);
    const start = courseRad - halfAngle;
    const end = courseRad + halfAngle;
    const segments = VIEWFIELD_SEGMENTS;

    /* 填充顶点 */
    const fillAttr = fan.fill.geometry.getAttribute('position') as THREE.BufferAttribute;
    const fillPos = fillAttr.array as Float32Array;
    fillPos[0] = 0;
    fillPos[1] = 0;
    fillPos[2] = 0;
    for (let i = 0; i <= segments; i++) {
      const a = start + (i / segments) * (end - start);
      const o = (i + 1) * 3;
      fillPos[o] = Math.cos(a) * radius;
      fillPos[o + 1] = 0;
      fillPos[o + 2] = Math.sin(a) * radius;
    }
    fillAttr.needsUpdate = true;
    fan.fill.geometry.computeBoundingSphere();

    /* 轮廓顶点 */
    const outlineAttr = fan.outline.geometry.getAttribute('position') as THREE.BufferAttribute;
    const outlinePos = outlineAttr.array as Float32Array;
    outlinePos[0] = 0;
    outlinePos[1] = 0;
    outlinePos[2] = 0;
    for (let i = 0; i <= segments; i++) {
      const a = start + (i / segments) * (end - start);
      const o = (i + 1) * 3;
      outlinePos[o] = Math.cos(a) * radius;
      outlinePos[o + 1] = 0;
      outlinePos[o + 2] = Math.sin(a) * radius;
    }
    outlineAttr.needsUpdate = true;
    fan.outline.geometry.computeBoundingSphere();

    /* 角点手柄置于边缘角点，方向手柄置于弧中点 */
    const cornerAngle = courseRad + halfAngle;
    fan.handle.position.set(Math.cos(cornerAngle) * radius, 0, Math.sin(cornerAngle) * radius);
    fan.courseHandle.position.set(Math.cos(courseRad) * radius, 0, Math.sin(courseRad) * radius);

    fan.group.position.set(
      item.sprite.position.x,
      item.sprite.position.y + VIEWFIELD_Y_OFFSET,
      item.sprite.position.z,
    );
  }

  /* ================================================================
     viewfield — 拖拽调整半径 / 角度
     ================================================================ */

  /** 指针按下：命中视野扇形手柄则进入编辑拖拽（禁用相机旋转），返回是否命中 */
  viewfieldDown(raycaster: THREE.Raycaster, mouse: THREE.Vector2): boolean {
    if (this.viewfieldMode === ViewfieldMode.hide) return false;
    const handles: THREE.Mesh[] = [];
    for (const [, item] of this._cache) {
      if (!item.inScene || !item.fan) continue;
      if (item.fan.handle.visible) handles.push(item.fan.handle);
      if (item.fan.courseHandle.visible) handles.push(item.fan.courseHandle);
    }
    if (handles.length === 0) return false;
    raycaster.setFromCamera(mouse, this.sceneService.camera);
    const hits = raycaster.intersectObjects(handles, false);
    if (hits.length === 0) return false;
    const hit = hits[0].object;
    const markerId = hit.userData['markerId'] as string;
    const part = hit.userData['viewfieldPart'] as 'corner' | 'course';
    const item = this._cache.get(markerId);
    if (!item?.fan) return false;
    this.viewfieldDragItem = item;
    this.viewfieldDragPart = part;
    this.sceneService.controls.enabled = false;
    this.sceneService.renderer.domElement.style.cursor = 'crosshair';
    return true;
  }

  /** 指针移动：拖拽手柄实时更新扇形半径/张角或朝向（按可修改标记分别处理） */
  viewfieldMove(raycaster: THREE.Raycaster, mouse: THREE.Vector2): void {
    const item = this.viewfieldDragItem;
    if (!item?.fan) return;
    const fan = item.fan;

    /* 命中扇形所在水平面，得到拖拽点世界坐标 */
    this.viewfieldDragPlane.constant = -(item.sprite.position.y + VIEWFIELD_Y_OFFSET);
    raycaster.setFromCamera(mouse, this.sceneService.camera);
    if (!raycaster.ray.intersectPlane(this.viewfieldDragPlane, this.viewfieldDragTarget)) return;

    const dx = this.viewfieldDragTarget.x - item.sprite.position.x;
    const dz = this.viewfieldDragTarget.z - item.sprite.position.z;

    if (this.viewfieldDragPart === 'course') {
      /* 方向手柄：以 marker 为中心旋转扇形，拖拽点相对 +X 轴的世界角度即新朝向 */
      if (!fan.courseEditable) return;
      if (Math.hypot(dx, dz) < VIEWFIELD_MIN_RADIUS) return;
      fan.course = THREE.MathUtils.radToDeg(Math.atan2(dz, dx));
    } else {
      /* 角点手柄：半径与张角分别按可修改标记处理 */
      if (fan.radiusEditable) {
        fan.radius = Math.max(VIEWFIELD_MIN_RADIUS, Math.hypot(dx, dz));
      }
      if (fan.angleEditable) {
        /* 拖拽点相对 course 方向的有符号夹角（取绝对值使扇形左右对称） */
        const courseRad = THREE.MathUtils.degToRad(fan.course);
        const hx = Math.cos(courseRad);
        const hz = Math.sin(courseRad);
        const dot = dx * hx + dz * hz;
        const cross = dx * hz - dz * hx;
        const halfAngle = THREE.MathUtils.clamp(
          Math.abs(Math.atan2(cross, dot)),
          THREE.MathUtils.degToRad(VIEWFIELD_MIN_HALF_ANGLE_DEG),
          THREE.MathUtils.degToRad(VIEWFIELD_MAX_HALF_ANGLE_DEG),
        );
        fan.angle = THREE.MathUtils.radToDeg(halfAngle) * 2;
      }
    }

    /* 回写数据（原地更新，保留 enabled/course 等既有字段） */
    if (item.data.viewfield) {
      item.data.viewfield.radius = fan.radius;
      item.data.viewfield.angle = fan.angle;
      item.data.viewfield.course = fan.course;
    }
    this.refreshFanGeometry(item);
  }

  /** 指针松开：结束拖拽，恢复相机旋转，输出扇形参数供外部保存 */
  viewfieldUp(): void {
    const item = this.viewfieldDragItem;
    if (!item) return;
    this.viewfieldDragItem = null;
    this.viewfieldDragPart = null;
    this.sceneService.controls.enabled = true;
    this.sceneService.renderer.domElement.style.cursor = '';
    if (item.fan) {
      this.viewfieldChange.emit({
        id: item.data.id,
        radius: item.fan.radius,
        angle: item.fan.angle,
        course: item.fan.course,
      });
    }
  }

  /** 是否正处于视野扇形拖拽编辑中 */
  viewfieldDragging(): boolean {
    return this.viewfieldDragItem != null;
  }

  /** 指针悬停：命中视野扇形手柄则高亮（改色 + 半透明），离开还原 */
  viewfieldHover(raycaster: THREE.Raycaster, mouse: THREE.Vector2): void {
    if (this.viewfieldMode === ViewfieldMode.hide) {
      this.clearViewfieldHover();
      return;
    }
    const handles: THREE.Mesh[] = [];
    for (const [, item] of this._cache) {
      if (!item.inScene || !item.fan) continue;
      if (item.fan.handle.visible) handles.push(item.fan.handle);
      if (item.fan.courseHandle.visible) handles.push(item.fan.courseHandle);
    }
    let hit: THREE.Mesh | null = null;
    if (handles.length > 0) {
      raycaster.setFromCamera(mouse, this.sceneService.camera);
      const hits = raycaster.intersectObjects(handles, false);
      if (hits.length > 0) hit = hits[0].object as THREE.Mesh;
    }
    if (hit === this.viewfieldHoverHandle) return;

    this.clearViewfieldHover();
    if (hit) {
      this.setViewfieldHandleHover(hit, true);
      this.viewfieldHoverHandle = hit;
    }
  }

  /** 清除视野扇形手柄的悬停高亮（鼠标离开画布时调用） */
  viewfieldHoverClear(): void {
    this.clearViewfieldHover();
  }

  /** 设置视野扇形手柄的悬停高亮状态（改色 + 半透明） */
  private setViewfieldHandleHover(handle: THREE.Mesh, hovered: boolean): void {
    const mat = handle.material as THREE.MeshBasicMaterial;
    if (hovered) {
      mat.color.setHex(VIEWFIELD_HANDLE_HOVER_COLOR);
      mat.transparent = true;
      mat.opacity = VIEWFIELD_HANDLE_HOVER_OPACITY;
    } else {
      mat.color.setHex(handle.userData['baseColor'] as number);
      mat.transparent = false;
      mat.opacity = 1;
    }
    mat.needsUpdate = true;
  }

  /** 清除视野扇形手柄的悬停高亮 */
  private clearViewfieldHover(): void {
    if (this.viewfieldHoverHandle) {
      this.setViewfieldHandleHover(this.viewfieldHoverHandle, false);
      this.viewfieldHoverHandle = null;
    }
  }

  /* ---- dispose ---- */
  dispose(): void {
    /* 清理报警扩散环 */
    if (this.alarmRingAnimating) {
      this.sceneService.removeBeforeRender(this.updateAlarmRings);
      this.alarmRingAnimating = false;
    }
    for (const [, item] of this._cache) {
      if (item.inScene) this.removeFromScene(item);
      if (item.alarmRings) {
        for (const ring of item.alarmRings) {
          ring.mesh.geometry.dispose();
          ring.material.dispose();
        }
      }
      if (item.fan) {
        this.disposeFan(item.fan);
        item.fan = undefined;
      }
      item.sprite.material.dispose();
      item.label.material.dispose();
      (item.label.material as THREE.SpriteMaterial).map?.dispose();
    }
    this._cache.clear();
    for (const [, tex] of this.textureCache) {
      tex.dispose();
    }
    this.textureCache.clear();
    if (this.labelUpdateRegistered) {
      this.sceneService.removeBeforeRender(this.updateLabelPositions);
      this.labelUpdateRegistered = false;
    }
    if (this.tc) {
      this.tc.detach();
      this.sceneService.overlayScene.remove(this.tc as any);
      this.tc.dispose();
      this.tc = undefined;
    }
  }

  /* ================================================================
     private — 纹理加载
     ================================================================ */

  private loadTexture(url: string): THREE.Texture {
    let tex = this.textureCache.get(url);
    if (!tex) {
      tex = this.textureLoader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      this.textureCache.set(url, tex);
    }
    return tex;
  }

  /** 根据 EntityState 加载一套纹理（hover/selected/offline 缺失时 fallback 到 normal） */
  private loadTextureSet(icon: {
    normal: string;
    hover?: string;
    selected?: string;
    offline?: string;
  }): MarkerTextureSet {
    const normal = this.loadTexture(icon.normal);
    const hover = icon.hover ? this.loadTexture(icon.hover) : normal;
    const selected = icon.selected ? this.loadTexture(icon.selected) : normal;
    const offline = icon.offline ? this.loadTexture(icon.offline) : undefined;
    return { normal, hover, selected, offline };
  }

  /** 检测 icon 配置是否发生变化（包括 alarm 子集） */
  private iconChanged(item: MarkerCache, icon: MarkerEntity['icon']): boolean {
    const current = item.textures;
    const newNormalUrl = icon.normal;
    const newHoverUrl = icon.hover ?? icon.normal;
    const newSelectedUrl = icon.selected ?? icon.normal;
    const newOfflineUrl = icon.offline ?? undefined;
    if (
      this.findTextureUrl(current.normal) !== newNormalUrl ||
      this.findTextureUrl(current.hover) !== newHoverUrl ||
      this.findTextureUrl(current.selected) !== newSelectedUrl ||
      this.findTextureUrl(current.offline) !== newOfflineUrl
    ) {
      return true;
    }
    /* 比较 alarm 子集 */
    const curAlarm = item.alarmTextures;
    const newAlarm = icon.alarm;
    if (!curAlarm && !newAlarm) return false;
    if (!curAlarm || !newAlarm) return true;
    return (
      this.findTextureUrl(curAlarm.normal) !== newAlarm.normal ||
      this.findTextureUrl(curAlarm.hover) !== (newAlarm.hover ?? newAlarm.normal) ||
      this.findTextureUrl(curAlarm.selected) !== (newAlarm.selected ?? newAlarm.normal) ||
      this.findTextureUrl(curAlarm.offline) !== (newAlarm.offline ?? undefined)
    );
  }

  private findTextureUrl(texture?: THREE.Texture): string | undefined {
    if (!texture) return undefined;
    for (const [url, tex] of this.textureCache) {
      if (tex === texture) return url;
    }
    return undefined;
  }

  /* ================================================================
     private — 纹理优先级解析
     ================================================================ */

  /** 根据当前离线/报警状态 + 交互 state 解析最终要显示的纹理 */
  private resolveCurrentTexture(
    data: MarkerEntity,
    textures: MarkerTextureSet,
    alarmTextures: MarkerTextureSet | undefined,
    state: 'normal' | 'hover' | 'selected',
  ): THREE.Texture {
    /* offline 时始终使用 offline 图标 */
    if (data.offline) {
      if (data.alarm && alarmTextures?.offline) {
        return alarmTextures.offline;
      }
      if (textures.offline) {
        return textures.offline;
      }
      /* 无 offline 图标则 fallback 到 normal */
      return textures.normal;
    }
    /* alarm 时使用 alarmTextures，并根据 hover/selected 选变体 */
    if (data.alarm && alarmTextures) {
      return alarmTextures[state];
    }
    return textures[state];
  }

  /** 按交互状态应用纹理（自动选择正确的 TextureSet） */
  private applyTextureByState(item: MarkerCache, state: 'normal' | 'hover' | 'selected'): void {
    const mat = item.sprite.material as THREE.SpriteMaterial;
    mat.map = this.resolveCurrentTexture(item.data, item.textures, item.alarmTextures, state);
    mat.needsUpdate = true;
  }

  /** 根据当前交互状态还原 marker 纹理 */
  private applyMarkerState(item: MarkerCache): void {
    if (item.data.offline) {
      /* offline 始终显示 offline 图标 */
      this.applyTextureByState(item, 'normal');
      item.state = 'normal';
      return;
    }
    if (item.data.id === this.focusedId) {
      this.applyTextureByState(item, 'selected');
      item.state = 'selected';
    } else {
      this.applyTextureByState(item, 'normal');
      item.state = 'normal';
    }
  }

  /* ================================================================
     private — 其他
     ================================================================ */

  private fixSpriteScale(sprite: THREE.Sprite, size = 32): void {
    const cam = this.sceneService.camera as any;
    if (!(cam as THREE.PerspectiveCamera).fov) return;
    const dist = cam.position.distanceTo(sprite.position);
    const vFov = ((cam as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    const height = 2 * dist * Math.tan(vFov / 2);
    const px = height / (this.sceneService.renderer?.domElement?.clientHeight || 600);
    const h = size * px;
    const aspect = (sprite.userData['aspect'] as number) || 1;
    sprite.scale.set(h * aspect, h, 1);
  }

  private createLabel(cam: MarkerEntity): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const fontSize = 20;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const tw = ctx.measureText(cam.name).width;
    const strokeWidth = 3;
    const pad = 8 + strokeWidth;
    canvas.width = tw + pad * 2;
    canvas.height = fontSize + pad * 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    /* 暗色描边 + 白色填充：深浅背景均能辨认 */
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = strokeWidth;
    ctx.strokeText(cam.name, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cam.name, canvas.width / 2, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.name = `marker_label_${cam.id}`;
    const aspect = canvas.width / canvas.height;
    sprite.scale.set(4 * aspect, 4, 1);
    sprite.userData['aspect'] = aspect;
    sprite.renderOrder = 999;
    return sprite;
  }

  private updateLabelPositions = (): void => {
    const cam = this.sceneService.camera;
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion).normalize();
    for (const [, item] of this._cache) {
      if (!item.inScene) continue;
      this.fixSpriteScale(item.sprite, 40);
      this.fixSpriteScale(item.label);
      const dist = cam.position.distanceTo(item.sprite.position);
      const vFov = ((cam as any).fov * Math.PI) / 180;
      const viewH = 2 * dist * Math.tan(vFov / 2);
      const px = viewH / (this.sceneService.renderer?.domElement?.clientHeight || 600);
      const offset = 6 * px + item.sprite.scale.y / 2;
      item.label.position.copy(item.sprite.position).addScaledVector(up, offset);
      /* 视野扇形跟随 marker 位置（拖拽移动时同步） */
      if (item.fan) {
        item.fan.group.position.set(
          item.sprite.position.x,
          item.sprite.position.y + VIEWFIELD_Y_OFFSET,
          item.sprite.position.z,
        );
      }
    }
  };

  private addToScene(item: MarkerCache): void {
    /* marker 相关全部放入 overlayScene，绕过 EffectComposer OutputPass 的二次 tone mapping */
    this.sceneService.overlayScene.add(item.sprite);
    this.sceneService.overlayScene.add(item.label);
    if (item.fan) {
      this.sceneService.overlayScene.add(item.fan.group);
    }
    if (item.alarmRings) {
      for (const ring of item.alarmRings) {
        ring.mesh.visible = true;
        this.sceneService.overlayScene.add(ring.mesh);
      }
    }
    item.inScene = true;
  }

  private removeFromScene(item: MarkerCache): void {
    this.sceneService.overlayScene.remove(item.sprite);
    this.sceneService.overlayScene.remove(item.label);
    if (item.fan) {
      this.sceneService.overlayScene.remove(item.fan.group);
    }
    if (item.alarmRings) {
      for (const ring of item.alarmRings) {
        this.sceneService.overlayScene.remove(ring.mesh);
      }
    }
    if (this.hoveredId === item.data.id) {
      this.hoveredId = null;
      this.sceneService.renderer.domElement.style.cursor = '';
    }
    item.inScene = false;
  }

  private getAtMouse(raycaster: THREE.Raycaster, mouse: THREE.Vector2): string | null {
    const sprites: THREE.Sprite[] = [];
    for (const [, item] of this._cache) {
      if (item.inScene) sprites.push(item.sprite);
    }
    if (sprites.length === 0) return null;
    raycaster.setFromCamera(mouse, this.sceneService.camera);
    const hits = raycaster.intersectObjects(sprites, false);
    return hits.length > 0 ? hits[0].object.userData['markerId'] : null;
  }
}
