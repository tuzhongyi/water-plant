import { Injectable } from '@angular/core';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';

@Injectable()
export class SettingMapDetailsBusiness {
  constructor(private service: GeographicRequestService) {}

  create(data: GeoMap) {
    data.Id = '';
    data.CreateTime = new Date();
    data.UpdateTime = new Date();
    return this.service.map.create(data);
  }
  update(data: GeoMap) {
    data.UpdateTime = new Date();
    return this.service.map.update(data);
  }
}
