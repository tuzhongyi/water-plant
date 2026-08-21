import { Injectable } from '@angular/core';
import { GeographicRequestService } from '../../../../common/data-core/request/services/geographic/geographic.service';

@Injectable()
export class SystemMainElementBusiness {
  constructor(private service: GeographicRequestService) {}

  reset(elementId: string) {
    return this.service.map.element.reset.state(elementId);
  }
}
