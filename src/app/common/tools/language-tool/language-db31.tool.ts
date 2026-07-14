import { DeviceCapability } from '../../data-core/models/devices/device.capability';
import { DB31RequestService } from '../../data-core/request/services/db31/db31.service';
import { PromiseValue } from '../value-tool/value.promise';

export class LanguageDB31Tool {
  constructor(service: DB31RequestService) {
    this.init(service);
  }
  private capability = new PromiseValue<DeviceCapability>();

  private init(service: DB31RequestService) {
    service.capability().then((x) => {
      this.capability.set(x);
    });
  }

  async DeviceState(value?: number, def = '') {
    let capability = await this.capability.get();
    let state = capability.DeviceStates?.find((x) => x.Value == value);
    if (state) {
      return state.Name;
    }
    return def;
  }
  async DeviceType(value?: number, def = '') {
    let capability = await this.capability.get();
    let state = capability.DeviceTypes?.find((x) => x.Value == value);
    if (state) {
      return state.Name;
    }
    return def;
  }
}
