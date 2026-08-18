import { firstValueFrom } from 'rxjs';
import {
  ModelFile,
  RenderMode,
} from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionApiService } from '../../../common/components/three-dimension/business/services/three-dimension-api.service';

export class SystemMainThreeModelBusiness {
  constructor(private service: ThreeDimensionApiService) {}

  private cache = new Map<string, ModelFile[]>();

  async load(mode: RenderMode): Promise<ModelFile[]> {
    if (this.cache.has(mode)) return this.cache.get(mode)!;
    const data = await firstValueFrom(this.service.models());
    this.cache.set(mode, data);
    return data;
  }
  async item(mode: RenderMode, modelId: string) {
    let all = await this.load(mode);
    return all.find((x) => x.name == modelId);
  }
  expansion(mode: RenderMode, modelId: string) {
    let id = this.convert.expansion(modelId);
    return this.item(mode, id);
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
