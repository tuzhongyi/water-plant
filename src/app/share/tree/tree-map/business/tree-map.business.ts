import { Injectable } from '@angular/core';
import { GeoMap } from '../../../../common/data-core/models/geographic/map.model';
import { GeographicRequestService } from '../../../../common/data-core/request/services/geographic/geographic.service';
import { TreeMapElementBusiness } from './tree-map-element.business';

@Injectable()
export class TreeMapBusiness {
  constructor(
    private service: GeographicRequestService,
    public element: TreeMapElementBusiness,
  ) {}

  /** 获取所有地图 */
  load() {
    return this.service.map.array();
  }

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
  delete(id: string) {
    return this.service.map.delete(id);
  }
}
