import { Injectable } from '@angular/core';
import { ThreeDimensionApiService } from '../../../common/components/three-dimension/business/services/three-dimension-api.service';
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
    api: ThreeDimensionApiService,
  ) {
    this.element = new SettingMapElementBusiness(service);
    this.model = new SettingMapModelBusiness(api);
  }

  async load(): Promise<MapModel | undefined> {
    let maps = await this.service.map.array();
    if (maps.length > 0) {
      return maps[0];
    }
    return undefined;
  }
}
