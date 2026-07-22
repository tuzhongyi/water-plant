import { Injectable } from '@angular/core';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';

@Injectable()
export class SystemElementManagerBusiness {
  constructor(private service: GeographicRequestService) {}

  buildings() {
    let params = new GetMapElementsParams();
    params.ElementTypes = [MapElementType.Building];
    return this.service.map.element.cache.all(params);
  }
}
