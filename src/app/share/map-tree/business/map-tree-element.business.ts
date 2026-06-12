import { Injectable } from '@angular/core';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';

@Injectable()
export class MapTreeElementBusiness {
  constructor(private service: GeographicRequestService) {}
  load(mapId: string) {
    let params = new GetMapElementsParams();
    params.MapId = mapId;
    return this.service.map.element.all(params);
  }

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
  delete(id: string) {
    return this.service.map.element.delete(id);
  }
}
