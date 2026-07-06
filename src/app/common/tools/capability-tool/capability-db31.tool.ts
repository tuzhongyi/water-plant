import { DB31Capability } from '../../data-core/models/db31/db31.capability';
import { DB31RequestService } from '../../data-core/request/services/db31/db31.service';
import { PromiseValue } from '../value-tool/value.promise';

export class CapabilityDB31Tool {
  constructor(service: DB31RequestService) {
    this.init(service);
  }
  private capability = new PromiseValue<DB31Capability>();

  private init(service: DB31RequestService) {
    service.capability().then((x) => {
      this.capability.set(x);
    });
  }

  get DeviceTypes() {
    return this.capability.get().then((x) => {
      return x.DeviceTypes ?? [];
    });
  }
  get DeviceStates() {
    return this.capability.get().then((x) => {
      return x.DeviceStates ?? [];
    });
  }
}
