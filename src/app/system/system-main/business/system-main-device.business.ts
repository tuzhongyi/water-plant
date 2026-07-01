import { Injectable } from '@angular/core';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';

@Injectable()
export class SystemMainDeviceBusiness {
  constructor(private service: DeviceRequestService) {}

  load() {
    return this.service.all();
  }
}
