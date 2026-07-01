import { Injectable } from '@angular/core';
import { ModelFile } from '../../../common/components/three-dimension/business/models/types';
import { ApiConfigService } from '../../../common/components/three-dimension/business/services/api-config.service';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
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
    private api: ApiConfigService,
  ) {
    this.model = new SettingMapModelBusiness(api);
    this.element = new SettingMapElementBusiness(service, this.model);
  }

  async load(): Promise<MapModel | undefined> {
    const [maps, models] = await Promise.all([this.service.map.array(), this.model.load()]);
    if (maps.length > 0) {
      return this.convert(maps[0], models);
    }
    return undefined;
  }

  private convert(map: GeoMap, models: ModelFile[]): MapModel {
    let result = Object.assign(new MapModel(), map);
    result.file = models.find((m) => {
      if (map.FileUrl && map.FileUrl.includes(m.name)) return true;
      return m.name === map.Name;
    });
    return result;
  }
}
