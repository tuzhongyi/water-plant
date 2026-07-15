import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ModelFile,
  RenderMode,
} from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionApiService } from '../../../common/components/three-dimension/business/services/three-dimension-api.service';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { LocaleCompare } from '../../../common/tools/compare-tool/compare.tool';
import { MapElementModel, MapModel } from '../../../setting/setting-map/business/setting-map.model';

@Injectable()
export class SystemMainThreeBusiness {
  constructor(
    private service: GeographicRequestService,
    private api: ThreeDimensionApiService,
  ) {}

  map = {
    load: async (): Promise<MapModel | undefined> => {
      let maps = await this.service.map.array();
      if (maps.length > 0) {
        return maps[0];
      }
      return undefined;
    },
  };
  element = {
    get: (id: string) => {
      return this.service.map.element.get(id);
    },
    all: () => {
      return this.service.map.element.all();
    },
    load: async (parentId?: string): Promise<MapElementModel[]> => {
      let params = new GetMapElementsParams();
      params.ElementTypes = [
        MapElementType.Camera,
        MapElementType.Announciator,
        MapElementType.IoTSensor,
      ];
      params.ParentId = parentId;
      let all = await this.service.map.element.all(params);
      if (!parentId) {
        all = all.filter((x) => !x.ParentId);
      }

      return all;
    },
    building: {
      load: async (): Promise<MapElementModel[]> => {
        let params = new GetMapElementsParams();
        params.ElementTypes = [MapElementType.Building];
        let all = await this.service.map.element.all(params);
        all = all.sort((a, b) => {
          return LocaleCompare.compare(b.Name, a.Name);
        });
        return all;
      },
      floor: {
        load: async (buildingId: string) => {
          let params = new GetMapElementsParams();
          params.ElementTypes = [MapElementType.Floor];
          params.ParentId = buildingId;
          return this.service.map.element.all(params);
        },
      },
    },
  };

  private cache: ModelFile[] = [];
  model = {
    load: async (mode: RenderMode): Promise<ModelFile[]> => {
      if (this.cache.length > 0) return this.cache;
      this.cache = await firstValueFrom(this.api.models(mode));
      return this.cache;
    },
    item: async (mode: RenderMode, modelId: string) => {
      let all = await this.model.load(mode);
      return all.find((x) => x.name == modelId);
    },
    expansion: (mode: RenderMode, modelId: string) => {
      let id = this.convert.expansion(modelId);
      return this.model.item(mode, id);
    },
  };

  private convert = {
    expansion: (modelId: string) => {
      const dot = modelId.lastIndexOf('.');
      const base = dot > 0 ? modelId.substring(0, dot) : modelId;
      const ext = dot > 0 ? modelId.substring(dot) : '';
      return `${base}_expansion${ext}`;
    },
  };
}
