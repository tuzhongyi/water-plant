import { Injectable } from '@angular/core';
import { GetVideoChannelsParams } from '../../../../common/data-core/request/services/device/device.params';
import { DeviceRequestService } from '../../../../common/data-core/request/services/device/device.service';
import { SystemVideoDeviceListArgs } from './system-video-device-list.model';

@Injectable()
export class SystemVideoDeviceListBusiness {
  constructor(private service: DeviceRequestService) {}

  load(args: SystemVideoDeviceListArgs) {
    let params = new GetVideoChannelsParams();
    params.Name = args.name;

    return this.service.video.channel.all(params);
  }
}
