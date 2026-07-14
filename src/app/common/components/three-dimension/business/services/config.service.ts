import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DEFAULT_RENDER_SETTINGS, VIEW_PRESETS } from '../models/constants';
import { RenderSettings, ThreeDimensionConfig } from '../models/types';
import { SceneService } from './scene.service';
import { StateService } from './state.service';
import { ThreeDimensionApiService } from './three-dimension-api.service';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private configApi = inject(ThreeDimensionApiService);
  private state = inject(StateService);
  private sceneService = inject(SceneService);

  async loadConfig(): Promise<ThreeDimensionConfig | null> {
    try {
      const res = await firstValueFrom(this.configApi.config());
      const config: ThreeDimensionConfig = { settings: res.settings };
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

  async autoLoadModels(): Promise<void> {
    const config = await this.loadConfig();
    if (!config) return;

    /* 模型文件由 viewer-container 通过 ApiModelService 加载，
       传递给 model-viewer 后从 activeConfig 查找并应用变换配置 */
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
