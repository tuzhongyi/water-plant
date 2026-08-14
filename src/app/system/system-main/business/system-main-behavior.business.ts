import { Injectable } from '@angular/core';
import { GetEventBehaviorsParams } from '../../../common/data-core/request/services/event/event.params';
import { EventRequestService } from '../../../common/data-core/request/services/event/event.service';

@Injectable()
export class SystemMainBehaviorBusiness {
  constructor(private service: EventRequestService) {}

  load(deviceId: string, db31?: boolean) {
    let params = new GetEventBehaviorsParams();
    params.DeviceIds = [deviceId];
    params.FromDB31 = db31;

    return this.service.behavior.all(params);
  }
}
