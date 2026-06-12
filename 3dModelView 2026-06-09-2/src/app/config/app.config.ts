import { InjectionToken } from '@angular/core';
import { RenderSettings, ViewPresetConfig, ModelColors } from '../models/types';
import { DEFAULT_RENDER_SETTINGS, VIEW_PRESETS, DEFAULT_MODEL_COLORS } from '../models/constants';

export interface AppConfig {
  settings: RenderSettings;
  viewPresets: Record<string, ViewPresetConfig>;
  modelColors: ModelColors;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

export const DEFAULT_APP_CONFIG: AppConfig = {
  settings: DEFAULT_RENDER_SETTINGS,
  viewPresets: VIEW_PRESETS,
  modelColors: DEFAULT_MODEL_COLORS,
};
