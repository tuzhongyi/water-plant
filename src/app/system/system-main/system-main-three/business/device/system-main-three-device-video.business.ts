import { DeviceRequestService } from '../../../../../common/data-core/request/services/device/device.service';

export class SystemMainThreeDeviceVideoBusiness {
  constructor(private service: DeviceRequestService) {}

  async get(id: string) {
    return this.service.video.channel.cache.get(id);
  }
  async state(id: string) {
    try {
      let channel = await this.get(id);
      return channel.ChannelState;
    } catch (error) {
      return 1;
    }
  }
}
