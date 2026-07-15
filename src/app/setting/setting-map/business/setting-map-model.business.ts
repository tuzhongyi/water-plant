import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ModelFile,
  RenderMode,
} from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionApiService } from '../../../common/components/three-dimension/business/services/three-dimension-api.service';

@Injectable()
export class SettingMapModelBusiness {
  constructor(private service: ThreeDimensionApiService) {}

  private cache: ModelFile[] = [];

  async load(): Promise<ModelFile[]> {
    if (this.cache.length > 0) return this.cache;
    this.cache = await firstValueFrom(this.service.models(RenderMode.overlay));
    return this.cache;
  }
  get = {
    expansion: (modelId: string) => {
      let id = this.convert.expansion(modelId);
      return this.item(id);
    },
  };

  private async item(modelId: string) {
    let all = await this.load();
    return all.find((x) => x.name == modelId);
  }

  private convert = {
    expansion: (modelId: string) => {
      const dot = modelId.lastIndexOf('.');
      const base = dot > 0 ? modelId.substring(0, dot) : modelId;
      const ext = dot > 0 ? modelId.substring(dot) : '';
      return `${base}_expansion${ext}`;
    },
  };
}
