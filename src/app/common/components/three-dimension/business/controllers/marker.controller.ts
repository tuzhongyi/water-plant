import { EventEmitter, Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/Addons.js';
import { MarkerEntity, ModelViewerModel } from '../models/types';
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
}

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
  labelMode: 'always' | 'hover' = 'hover';
  private labelUpdateRegistered = false;

  /* 事件 */
  markerClick = new EventEmitter<string>();
  markerDblClick = new EventEmitter<string>();
  markerPositionChange = new EventEmitter<MarkerEntity>();

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
          const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: initialTex,
              depthTest: false,
              depthWrite: false,
            }),
          );
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
        this.markerClick.emit(id);
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

      /* 还原上一个选中的 marker 状态 */
      if (this.focusedId && this.focusedId !== selId) {
        const prev = this._cache.get(this.focusedId);
        if (prev) {
          this.applyMarkerState(prev);
        }
      }

      if (!selId) {
        this.focusedId = null;
        return;
      }

      const item = this._cache.get(selId);
      if (!item || !item.inScene) {
        this.focusedId = null;
        return;
      }

      this.focusedId = selId;
      for (const [, m] of this._cache) {
        if (m.label) m.label.visible = m === item;
      }

      /* offline 状态下不改变图标；否则设置为 selected */
      if (!item.data.offline) {
        this.applyTextureByState(item, 'selected');
        item.state = 'selected';
      }

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

  /* ---- dispose ---- */
  dispose(): void {
    for (const [, item] of this._cache) {
      if (item.inScene) this.removeFromScene(item);
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
    const pad = 8;
    canvas.width = tw + pad * 2;
    canvas.height = fontSize + pad * 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
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
      this.fixSpriteScale(item.sprite);
      this.fixSpriteScale(item.label);
      const dist = cam.position.distanceTo(item.sprite.position);
      const vFov = ((cam as any).fov * Math.PI) / 180;
      const viewH = 2 * dist * Math.tan(vFov / 2);
      const px = viewH / (this.sceneService.renderer?.domElement?.clientHeight || 600);
      const offset = 6 * px + item.sprite.scale.y / 2;
      item.label.position.copy(item.sprite.position).addScaledVector(up, offset);
    }
  };

  private addToScene(item: MarkerCache): void {
    this.sceneService.scene.add(item.sprite);
    this.sceneService.scene.add(item.label);
    item.inScene = true;
  }

  private removeFromScene(item: MarkerCache): void {
    this.sceneService.scene.remove(item.sprite);
    this.sceneService.scene.remove(item.label);
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
