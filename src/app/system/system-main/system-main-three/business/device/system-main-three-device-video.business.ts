import { DeviceRequestService } from '../../../../../common/data-core/request/services/device/device.service';

export class SystemMainThreeDeviceVideoBusiness {
  constructor(private service: DeviceRequestService) {}

  async get(id: string) {
    return this.service.video.channel.cache.get(id);
  }
  /**	通道状态：0-在线，1-离线
      查不到通道时返回 undefined，由调用方回退到 ElementState，不能直接判为离线 */
  async state(id: string): Promise<number | undefined> {
    try {
      let channel = await this.get(id);
      return channel.ChannelState;
    } catch (error) {
      return undefined;
    }
  }
}
