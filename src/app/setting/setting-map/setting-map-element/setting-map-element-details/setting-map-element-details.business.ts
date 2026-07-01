import { Injectable } from '@angular/core';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { GeographicRequestService } from '../../../../common/data-core/request/services/geographic/geographic.service';

@Injectable()
export class SettingMapElementDetailsBusiness {
  constructor(private service: GeographicRequestService) {}

  create(data: GeoMapElement) {
    data.Id = '';
    data.CreateTime = new Date();
    data.UpdateTime = new Date();
    return this.service.map.element.create(data);
  }
  update(data: GeoMapElement) {
    data.UpdateTime = new Date();
    return this.service.map.element.update(data);
  }
}
