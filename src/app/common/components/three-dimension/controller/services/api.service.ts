import { Injectable } from '@angular/core';
import { PathTool } from '../../../../../common/tools/path-tool/path.tool';
import {
  ApiConfigResponse,
  ModelFile,
  ModelTransformConfig,
  RenderSettings,
} from '../models/types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  getModels(): Promise<ModelFile[]> {
    return fetch(PathTool.three.json.models).then((response) => {
      return response.json().then((x) => {
        return x as ModelFile[];
      });
    });
  }
  getConfig(): Promise<ApiConfigResponse> {
    return Promise.all([this.config.global(), this.config.models()]).then((response) => {
      return {
        settings: response[0],
        models: response[1],
      };
    });
  }

  private config = {
    global: (): Promise<RenderSettings> => {
      return fetch(PathTool.three.json.config.global).then((response) => {
        return response.json().then((x) => {
          return x as RenderSettings;
        });
      });
    },
    models: (): Promise<Record<string, ModelTransformConfig>> => {
      return fetch(PathTool.three.json.config.models).then((response) => {
        return response.json().then((x) => {
          return x as Record<string, ModelTransformConfig>;
        });
      });
    },
  };
}
