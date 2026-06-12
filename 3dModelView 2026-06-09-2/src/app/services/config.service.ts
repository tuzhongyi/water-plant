import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import * as THREE from 'three';
import { ApiService } from './api.service';
import { StateService } from './state.service';
import { ModelService } from './model.service';
import { ColorsService } from './colors.service';
import { SceneService } from './scene.service';
import { VIEW_PRESETS, DEFAULT_RENDER_SETTINGS } from '../models/constants';
import { MaterialColorState, ModelConfig, ModelTransformConfig, RenderSettings, SceneCamera, SceneCameraConfig } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private api = inject(ApiService);
  private state = inject(StateService);
  private modelService = inject(ModelService);
  private colorsService = inject(ColorsService);
  private sceneService = inject(SceneService);

  async loadConfig(): Promise<ModelConfig | null> {
    try {
      const res = await firstValueFrom(this.api.getConfig());
      const config: ModelConfig = {
        settings: res.settings,
        models: res.models,
        sceneCameras: res.sceneCameras ?? [],
      };
      this.state.activeConfig$.next(config);
      /* 合并默认值确保旧 config 缺失字段仍有有效值 */
      const mergedSettings: RenderSettings = { ...DEFAULT_RENDER_SETTINGS, ...res.settings };
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
    return this.state.sceneCameras.map(cam => {
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

  async saveConfig(): Promise<boolean> {
    const models: Record<string, ModelTransformConfig> = {};
    for (const [, entry] of this.state.loadedModels) {
      const materialColors: Record<string, MaterialColorState> = {};
      for (const [matName, state] of entry.materialColors) {
        materialColors[matName] = { ...state };
      }

      const meshVisibility: Record<string, boolean> = {};
      entry.model.traverse(c => {
        const m = c as THREE.Mesh;
        if (m.isMesh && m.name) {
          meshVisibility[m.name] = m.visible;
        }
      });

      models[entry.fileName] = {
        name: entry.fileName,
        position: { x: entry.editPosition.x, y: entry.editPosition.y, z: entry.editPosition.z },
        scale: { x: entry.editScale.x, y: entry.editScale.y, z: entry.editScale.z },
        rotation: {
          h: THREE.MathUtils.radToDeg(entry.editRotation.x),
          p: THREE.MathUtils.radToDeg(entry.editRotation.y),
          b: THREE.MathUtils.radToDeg(entry.editRotation.z),
        },
        colors: entry.colors,
        materialColors,
        meshVisibility,
        label: entry.label,
        labelVisible: entry.labelVisible,
        ...(entry.labelPerHeight !== undefined ? { labelPerHeight: entry.labelPerHeight } : {}),
        ...(entry.labelFontSize !== undefined ? { labelFontSize: entry.labelFontSize } : {}),
      };
    }
    const cam = this.sceneService.camera;
    const ctrl = this.sceneService.controls;
    const { showLabels, labelFontSize, labelHeight, ...rest } = this.state.settings;
    const settings: RenderSettings = {
      ...rest,
      camPos: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
      camTgt: { x: ctrl.target.x, y: ctrl.target.y, z: ctrl.target.z },
    } as RenderSettings;

    const sceneCameras = this.serializeSceneCameras();

    try {
      await firstValueFrom(this.api.saveConfig({ settings, models, sceneCameras }));
      this.state.activeConfig$.next({ settings, models, sceneCameras });
      return true;
    } catch {
      return false;
    }
  }

  async autoLoadModels(): Promise<void> {
    const config = await this.loadConfig();
    if (!config) return;

    /* 恢复场景摄像机 */
    if (config.sceneCameras && config.sceneCameras.length > 0) {
      this.restoreSceneCameras(config.sceneCameras);
    }

    if (!config.models || Object.keys(config.models).length === 0) return;

    const files = await firstValueFrom(this.api.getModels());
    const existingFiles = new Set(files.map(f => f.name));

    for (const [filename, transform] of Object.entries(config.models)) {
      if (!existingFiles.has(filename)) continue;
      const entry = await this.modelService.loadModel(`/models/${filename}`, filename, transform);
      if (entry) {
        /* 恢复 per-model label 设置 */
        if (transform.label !== undefined) {
          entry.label = transform.label;
        }
        if (transform.labelVisible !== undefined) {
          entry.labelVisible = transform.labelVisible;
        }
        if (transform.labelPerHeight !== undefined) {
          entry.labelPerHeight = transform.labelPerHeight;
        }
        if (transform.labelFontSize !== undefined) {
          entry.labelFontSize = transform.labelFontSize;
        }
        /* 重新渲染 label 以应用恢复的设置 */
        this.modelService.updateLabel(entry);

        /* 恢复材质颜色（只恢复当前模型实际存在的材质，丢弃孤儿条目） */
        if (transform.materialColors) {
          const actualNames = new Set(
            this.colorsService.getMaterials(entry).map(m => m.name)
          );
          for (const [matName, state] of Object.entries(transform.materialColors)) {
            if (actualNames.has(matName)) {
              entry.materialColors.set(matName, { ...state });
            }
          }
        }

        /* 恢复 mesh 可见性 */
        if (transform.meshVisibility) {
          entry.model.traverse(c => {
            const m = c as THREE.Mesh;
            if (m.isMesh && m.name && transform.meshVisibility![m.name] !== undefined) {
              m.visible = transform.meshVisibility![m.name];
            }
          });
        }

        /* 应用 normal 状态颜色（边缘 + 背景 + 材质） */
        this.colorsService.applyStateColors(entry, 'normal');
      }
    }
  }

  private restoreSceneCameras(configs: SceneCameraConfig[]): void {
    /* 清除现有摄像机 */
    const existingIds = this.state.sceneCameras.map(c => c.id);
    for (const id of existingIds) {
      const cam = this.state.sceneCameras.find(c => c.id === id);
      if (cam) {
        this.sceneService.scene.remove(cam.helper);
        cam.helper.dispose();
        this.sceneService.scene.remove(cam.model);
        cam.model.traverse((c: any) => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      }
      this.state.removeSceneCamera(id);
    }

    /* 从保存的配置重建 */
    for (const cfg of configs) {
      const { camera: perspCam, orthoCamera, helper, model, bodyMat, lensMat, vfMat } = this.sceneService.createCameraObject();
      this.sceneService.scene.add(helper);
      this.sceneService.scene.add(model);

      /* 应用保存的位置/朝向 */
      perspCam.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
      perspCam.rotation.set(
        THREE.MathUtils.degToRad(cfg.rotation.h),
        THREE.MathUtils.degToRad(cfg.rotation.p),
        THREE.MathUtils.degToRad(cfg.rotation.b),
        'YXZ'
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

  exportConfig(): void {
    const models: Record<string, ModelTransformConfig> = {};
    for (const [, entry] of this.state.loadedModels) {
      const materialColors: Record<string, MaterialColorState> = {};
      for (const [matName, state] of entry.materialColors) {
        materialColors[matName] = { ...state };
      }

      const meshVisibility: Record<string, boolean> = {};
      entry.model.traverse(c => {
        const m = c as THREE.Mesh;
        if (m.isMesh && m.name) {
          meshVisibility[m.name] = m.visible;
        }
      });

      models[entry.fileName] = {
        name: entry.fileName,
        position: { x: entry.editPosition.x, y: entry.editPosition.y, z: entry.editPosition.z },
        scale: { x: entry.editScale.x, y: entry.editScale.y, z: entry.editScale.z },
        rotation: {
          h: THREE.MathUtils.radToDeg(entry.editRotation.x),
          p: THREE.MathUtils.radToDeg(entry.editRotation.y),
          b: THREE.MathUtils.radToDeg(entry.editRotation.z),
        },
        colors: entry.colors,
        materialColors,
        meshVisibility,
        label: entry.label,
        labelVisible: entry.labelVisible,
        ...(entry.labelPerHeight !== undefined ? { labelPerHeight: entry.labelPerHeight } : {}),
        ...(entry.labelFontSize !== undefined ? { labelFontSize: entry.labelFontSize } : {}),
      };
    }

    const cam = this.sceneService.camera;
    const ctrl = this.sceneService.controls;
    const { showLabels: _sl2, labelFontSize: _lfs2, labelHeight: _lh2, ...rest2 } = this.state.settings;
    const data: ModelConfig = {
      settings: {
        ...rest2,
        camPos: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
        camTgt: { x: ctrl.target.x, y: ctrl.target.y, z: ctrl.target.z },
      } as RenderSettings,
      models,
      sceneCameras: this.serializeSceneCameras(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config_export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importConfig(file: File): Promise<boolean> {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as ModelConfig;
          if (data.settings) {
            this.state.settings$.next({ ...data.settings });
            this.state.viewPreset$.next(data.settings.viewPreset || 'medium');
            this.restoreCameraFromSettings(data.settings);
          }
          if (data.models) {
            const config: ModelConfig = { settings: this.state.settings, models: data.models, sceneCameras: data.sceneCameras };
            this.state.activeConfig$.next(config);
          }
          if (data.sceneCameras) {
            this.restoreSceneCameras(data.sceneCameras);
          }
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
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
    }
    ctrl.update();
  }
}
