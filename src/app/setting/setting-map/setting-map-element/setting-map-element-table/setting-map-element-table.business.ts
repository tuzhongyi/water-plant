import { Injectable } from '@angular/core';
import { GetMapElementsParams } from '../../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../../common/data-core/request/services/geographic/geographic.service';
import { SettingMapElementTableFilter } from './setting-map-element-table.model';

@Injectable()
export class SettingMapElementTableBusiness {
  constructor(private service: GeographicRequestService) {}

  async load(index: number, size: number, filter: SettingMapElementTableFilter) {
    let params = new GetMapElementsParams();
    params.PageIndex = index;
    params.PageSize = size;

    if (filter.name) {
      params.Name = filter.name;
    }
    if (filter.type !== undefined) {
      params.ElementTypes = [filter.type];
    }

    return this.service.map.element.list(params);
  }
}
