import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ModelFile,
  RenderMode,
} from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionApiService } from '../../../common/components/three-dimension/business/services/three-dimension-api.service';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { ConfigRequestService } from '../../../common/data-core/request/config/config-request.service';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { LocaleCompare } from '../../../common/tools/compare-tool/compare.tool';
import { PromiseValue } from '../../../common/tools/value-tool/value.promise';
import { MapElementModel, MapModel } from '../../../setting/setting-map/business/setting-map.model';
import { SystemMainThreeArgs } from './system-main-three.model';

@Injectable()
export class SystemMainThreeBusiness {
  constructor(
    private service: GeographicRequestService,
    private api: ThreeDimensionApiService,
    private config: ConfigRequestService,
  ) {
    this.config.get().then((x) => {
      this.map.radius.set(x.map.find.radius);
    });
  }

  map = {
    load: async (): Promise<MapModel | undefined> => {
      let maps = await this.service.map.array();
      if (maps.length > 0) {
        return maps[0];
      }
      return undefined;
    },
    radius: new PromiseValue<number>(),
  };
  element = {
    get: (id: string) => {
      return this.service.map.element.get(id);
    },
    all: () => {
      return this.service.map.element.all();
    },
    load: async (args: SystemMainThreeArgs): Promise<MapElementModel[]> => {
      let params = new GetMapElementsParams();
      params.ElementTypes = [
        MapElementType.Camera,
        MapElementType.Announciator,
        MapElementType.IoTSensor,
      ];
      params.ParentId = args.parent;
      params.Name = args.name;
      if (args.type != undefined) {
        params.ElementTypes = [args.type];
      }
      let all = await this.service.map.element.all(params);
      if (!args.parent) {
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
          let datas = await this.service.map.element.all(params);
          datas = datas.sort((a, b) => {
            return LocaleCompare.compare(a.Name, b.Name);
          });
          return datas;
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
