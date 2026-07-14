import { GeographicCapability } from '../../data-core/models/geographic/geographic.capability';
import { GeographicRequestService } from '../../data-core/request/services/geographic/geographic.service';
import { PromiseValue } from '../value-tool/value.promise';

export class CapabilityGeographicTool {
  constructor(service: GeographicRequestService) {
    this.init(service);
  }
  private capability = new PromiseValue<GeographicCapability>();

  private init(service: GeographicRequestService) {
    service.capability().then((x) => {
      this.capability.set(x);
    });
  }

  get ElementTypes() {
    return this.capability.get().then((x) => {
      return x.ElementTypes ?? [];
    });
  }
  get ElementStates() {
    return this.capability.get().then((x) => {
      return x.ElementStates ?? [];
    });
  }
}
