import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import * as THREE from 'three';
import { DEFAULT_RENDER_SETTINGS, VIEW_PRESETS } from '../models/constants';
import {
  RenderSettings,
  SceneCamera,
  SceneCameraConfig,
  ThreeDimensionConfig,
} from '../models/types';
import { ColorsService } from './colors.service';
import { ModelService } from './model.service';
import { SceneService } from './scene.service';
import { StateService } from './state.service';
import { ThreeDimensionApiService } from './three-dimension-api.service';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private configApi = inject(ThreeDimensionApiService);
  private state = inject(StateService);
  private modelService = inject(ModelService);
  private colorsService = inject(ColorsService);
  private sceneService = inject(SceneService);

  async loadConfig(): Promise<ThreeDimensionConfig | null> {
    try {
      const res = await firstValueFrom(this.configApi.config());
      const config: ThreeDimensionConfig = {
        settings: res.settings,
        models: res.models,
        sceneCameras: res.sceneCameras ?? [],
      };
      this.state.activeConfig$.next(config);
      /* 合并默认值确保旧 config 缺失字段仍有有效值 */
      const mergedSettings: RenderSettings = {
        ...DEFAULT_RENDER_SETTINGS,
        ...res.settings,
      };
      this.state.settings$.next(mergedSettings);
      this.state.viewPreset$.next(mergedSettings.viewPreset || 'medium');

      /* 从保存的配置恢复相机视图、maxDistance、网格大小 */
      this.restoreCameraFromSettings(res.settings);

      return config;
    } catch {
      return null;
    }
  }

  private serializeSceneCameras(): SceneCameraConfig[] {
    return this.state.sceneCameras.map((cam) => {
      const p = cam.perspCamera.position;
      const euler = new THREE.Euler().setFromQuaternion(cam.perspCamera.quaternion, 'YXZ');
      return {
        id: cam.id,
        name: cam.name,
        position: { x: p.x, y: p.y, z: p.z },
        rotation: {
          h: THREE.MathUtils.radToDeg(euler.x),
          p: THREE.MathUtils.radToDeg(euler.y),
          b: THREE.MathUtils.radToDeg(euler.z),
        },
        fov: cam.perspCamera.fov,
        near: cam.perspCamera.near,
        far: cam.perspCamera.far,
        isOrtho: cam.isOrtho,
        zoom: cam.orthoCamera.zoom,
        colors: cam.colors,
      };
    });
  }

  async autoLoadModels(): Promise<void> {
    const config = await this.loadConfig();
    if (!config) return;

    /* 恢复场景摄像机 */
    if (config.sceneCameras && config.sceneCameras.length > 0) {
      this.restoreSceneCameras(config.sceneCameras);
    }

    /* 模型文件由 viewer-container 通过 ApiModelService 加载，
       传递给 model-viewer 后从 activeConfig 查找并应用变换配置 */
  }

  private restoreSceneCameras(configs: SceneCameraConfig[]): void {
    /* 清除现有摄像机 — 由 model-viewer 负责 scene.add/remove */
    const existingIds = this.state.sceneCameras.map((c) => c.id);
    for (const id of existingIds) {
      const cam = this.state.sceneCameras.find((c) => c.id === id);
      if (cam) {
        cam.helper.dispose();
        cam.model.traverse((c: any) => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      }
      this.state.removeSceneCamera(id);
    }

    /* 从保存的配置重建 — model-viewer 监听 sceneCameras 后将 helper/model 加入场景 */
    for (const cfg of configs) {
      const {
        camera: perspCam,
        orthoCamera,
        helper,
        model,
        bodyMat,
        lensMat,
        vfMat,
      } = this.sceneService.createCameraObject();

      /* 应用保存的位置/朝向 */
      perspCam.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
      perspCam.rotation.set(
        THREE.MathUtils.degToRad(cfg.rotation.h),
        THREE.MathUtils.degToRad(cfg.rotation.p),
        THREE.MathUtils.degToRad(cfg.rotation.b),
        'YXZ',
      );
      orthoCamera.position.copy(perspCam.position);
      orthoCamera.quaternion.copy(perspCam.quaternion);
      perspCam.fov = cfg.fov;
      perspCam.near = cfg.near;
      perspCam.far = cfg.far;
      orthoCamera.near = cfg.near;
      orthoCamera.far = cfg.far;
      orthoCamera.zoom = cfg.zoom;
      perspCam.updateProjectionMatrix();
      orthoCamera.updateProjectionMatrix();

      const sceneCam: SceneCamera = {
        id: cfg.id,
        name: cfg.name,
        camera: cfg.isOrtho ? orthoCamera : perspCam,
        perspCamera: perspCam,
        orthoCamera: orthoCamera,
        isOrtho: cfg.isOrtho,
        helper,
        model,
        colors: cfg.colors,
        bodyMat,
        lensMat,
        vfMat,
      };

      /* 设置 model 引用正确的 camera */
      (model as any).setActiveCamera(sceneCam.camera);
      helper.update();
      (model as any).updateTransform();

      this.state.addSceneCamera(sceneCam);
    }
  }

  /** 从保存的配置恢复相机视图、maxDistance、网格大小 */
  private restoreCameraFromSettings(s: RenderSettings): void {
    const cam = this.sceneService.camera;
    const ctrl = this.sceneService.controls;
    if (!cam || !ctrl) return;

    if (s.camPos) {
      cam.position.set(s.camPos.x, s.camPos.y, s.camPos.z);
    }
    if (s.camTgt) {
      ctrl.target.set(s.camTgt.x, s.camTgt.y, s.camTgt.z);
    }

    const preset = VIEW_PRESETS[s.viewPreset];
    if (preset) {
      ctrl.maxDistance = preset.maxDist;
      this.sceneService.setGridSize(preset.grid);
      this.sceneService.setAxesSize(Math.max(preset.grid / 5, 2));
    }
    ctrl.update();
  }
}
