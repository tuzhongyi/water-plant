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

  /**	通道所属设备的名称（列表悬停提示用）；设备接口带缓存，同一个设备不会重复请求
      @returns 设备名称，查不到时返回空串 */
  async deviceName(deviceId: string): Promise<string> {
    if (!deviceId) return '';
    try {
      let device = await this.service.cache.get(deviceId);
      return device?.Name ?? '';
    } catch {
      return '';
    }
  }
}
