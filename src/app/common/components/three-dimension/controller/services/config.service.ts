import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { PathTool } from '../../../../../common/tools/path-tool/path.tool';
import { VIEW_PRESETS } from '../models/constants';
import {
  MaterialColorState,
  ModelConfig,
  ModelTransformConfig,
  RenderSettings,
} from '../models/types';
import { ApiService } from './api.service';
import { ColorsService } from './colors.service';
import { EdgesService } from './edges.service';
import { ModelService } from './model.service';
import { SceneService } from './scene.service';
import { StateService } from './state.service';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private api = inject(ApiService);
  private state = inject(StateService);
  private modelService = inject(ModelService);
  private edgesService = inject(EdgesService);
  private colorsService = inject(ColorsService);
  private sceneService = inject(SceneService);

  async loadConfig(): Promise<ModelConfig | null> {
    try {
      const res = await this.api.getConfig();
      const config: ModelConfig = {
        settings: res.settings,
        models: res.models,
      };
      this.state.activeConfig$.next(config);
      this.state.settings$.next({ ...res.settings });
      this.state.viewPreset$.next(res.settings.viewPreset || 'medium');

      /* 从保存的配置恢复相机视图、maxDistance、网格大小 */
      this.restoreCameraFromSettings(res.settings);

      return config;
    } catch {
      return null;
    }
  }

  async autoLoadModels(): Promise<void> {
    const config = await this.loadConfig();
    if (!config || !config.models || Object.keys(config.models).length === 0) return;

    const files = await this.api.getModels();
    const existingFiles = new Set(files.map((f) => f.name));

    for (const [filename, transform] of Object.entries(config.models)) {
      if (!existingFiles.has(filename)) continue;
      const entry = await this.modelService.loadModel(
        PathTool.three.get.glb(filename),
        filename,
        transform,
      );
      if (entry) {
        /* 恢复材质颜色 */
        if (transform.materialColors) {
          entry.materialColors.clear();
          for (const [matName, state] of Object.entries(transform.materialColors)) {
            entry.materialColors.set(matName, { ...state });
          }
        }

        /* 恢复 mesh 可见性 */
        if (transform.meshVisibility) {
          entry.model.traverse((c) => {
            const m = c as THREE.Mesh;
            if (m.isMesh && m.name && transform.meshVisibility![m.name] !== undefined) {
              m.visible = transform.meshVisibility![m.name];
            }
          });
        }

        /* 应用 normal 状态颜色（边缘 + 背景 + 材质） */
        this.colorsService.applyStateColors(entry, 'normal');

        if (transform.render) {
          entry.renderSettings = { ...transform.render };
          this.edgesService.createHardEdgesForEntry(entry);
          this.edgesService.applyRenderMode(entry, entry.renderSettings.renderMode ?? 'solid');
        }
      }
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
      entry.model.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh && m.name) {
          meshVisibility[m.name] = m.visible;
        }
      });

      models[entry.fileName] = {
        position: { x: entry.editPosition.x, y: entry.editPosition.y, z: entry.editPosition.z },
        scale: { x: entry.editScale.x, y: entry.editScale.y, z: entry.editScale.z },
        rotation: {
          h: THREE.MathUtils.radToDeg(entry.editRotation.x),
          p: THREE.MathUtils.radToDeg(entry.editRotation.y),
          b: THREE.MathUtils.radToDeg(entry.editRotation.z),
        },
        colors: entry.colors,
        render: entry.renderSettings,
        materialColors,
        meshVisibility,
      };
    }

    const cam = this.sceneService.camera;
    const ctrl = this.sceneService.controls;
    const data: ModelConfig = {
      settings: {
        ...this.state.settings,
        camPos: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
        camTgt: { x: ctrl.target.x, y: ctrl.target.y, z: ctrl.target.z },
      },
      models,
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
    return new Promise((resolve) => {
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
            const config: ModelConfig = { settings: this.state.settings, models: data.models };
            this.state.activeConfig$.next(config);
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
