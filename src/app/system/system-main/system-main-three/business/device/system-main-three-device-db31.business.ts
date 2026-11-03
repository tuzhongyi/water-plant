import { DB31RequestService } from '../../../../../common/data-core/request/services/db31/db31.service';

export class SystemMainThreeDeviceDB31Business {
  constructor(private service: DB31RequestService) {}

  get(id: string) {
    return this.service.channel.cache.get(id);
  }
  /**	设备状态：0-在线，1-离线
      查不到通道/设备时返回 undefined，由调用方回退到 ElementState，不能直接判为离线 */
  async state(id: string): Promise<number | undefined> {
    try {
      let channel = await this.get(id);
      let device = await this.service.device.cache.get(channel.DeviceId);
      return device.DeviceState;
    } catch (error) {
      return undefined;
    }
  }
}
