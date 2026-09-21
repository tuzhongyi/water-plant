import { Injectable } from '@angular/core';
import { GetMapElementsParams } from '../../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../../common/data-core/request/services/geographic/geographic.service';

@Injectable()
export class SystemMainElementBusiness {
  constructor(private service: GeographicRequestService) {}

  reset(elementId: string) {
    return this.service.map.element.reset.state(elementId);
  }
  async get(elementId: string) {
    let params = new GetMapElementsParams();
    params.ElementIds = [elementId];
    let array = await this.service.map.element.all(params);
    if (array.length == 1) {
      return array[0];
    }
    return undefined;
  }
}
