import { DB31RequestService } from '../../../../../common/data-core/request/services/db31/db31.service';

export class SystemMainThreeDeviceDB31Business {
  constructor(private service: DB31RequestService) {}

  get(id: string) {
    return this.service.channel.cache.get(id);
  }
  async state(id: string) {
    try {
      let channel = await this.get(id);
      let device = await this.service.device.cache.get(channel.DeviceId);
      return device.DeviceState;
    } catch (error) {
      return 1;
    }
  }
}
