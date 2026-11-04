import { Injectable } from '@angular/core';
import {
  ModelFile,
  ModelType,
} from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionApiService } from '../../../common/components/three-dimension/business/services/three-dimension-api.service';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { ConfigRequestService } from '../../../common/data-core/request/config/config-request.service';
import { DB31RequestService } from '../../../common/data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { SettingMapElementBusiness } from './setting-map-element.business';
import { SettingMapModelBusiness } from './setting-map-model.business';
import { MapModel } from './setting-map.model';

@Injectable()
export class SettingMapBusiness {
  element: SettingMapElementBusiness;
  model: SettingMapModelBusiness;
  constructor(
    private service: GeographicRequestService,
    private config: ConfigRequestService,
    api: ThreeDimensionApiService,
    device: DeviceRequestService,
    db31: DB31RequestService,
  ) {
    this.element = new SettingMapElementBusiness(service, device, db31);
    this.model = new SettingMapModelBusiness(api);
  }

  async load(): Promise<MapModel | undefined> {
    let maps = await this.service.map.array();
    if (maps.length > 0) {
      return maps[0];
    }
    /*	没有地图数据时按村庄模型创建一张，建筑/楼层由 3D 组件的初始化补齐 */
    return await this.create();
  }

  /**	所有模型数据中 type=village 的模型	*/
  get village(): Promise<ModelFile | undefined> {
    return this.model.load().then((models) => {
      return models.find((x) => x.type == ModelType.village);
    });
  }

  /**	用村庄模型创建地图：FileUrl 指向模型文件，名称取 config.json 的 title	*/
  private async create(): Promise<MapModel | undefined> {
    let village = await this.village;
    if (!village) return undefined;

    let config = await this.config.get();
    let map = new GeoMap();
    map.Id = '';
    map.Name = config.title;
    map.MapType = 1;
    map.FileUrl = village.name;
    map.CreateTime = new Date();
    map.UpdateTime = new Date();
    return this.service.map.create(map);
  }
}
