import { Injectable } from '@angular/core';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';

@Injectable()
export class SystemMainThreeManagerBusiness {
  constructor(private service: DeviceRequestService) {}

  camera = {
    load: async () => {
      let all = await this.service.video.channel.all();
      return all;
    },
  };
}
