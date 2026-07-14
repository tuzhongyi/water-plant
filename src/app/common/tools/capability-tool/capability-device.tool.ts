import { DeviceCapability } from '../../data-core/models/devices/device.capability';
import { DeviceRequestService } from '../../data-core/request/services/device/device.service';
import { PromiseValue } from '../value-tool/value.promise';

export class CapabilityDeviceTool {
  constructor(service: DeviceRequestService) {
    this.init(service);
  }
  private capability = new PromiseValue<DeviceCapability>();

  private init(service: DeviceRequestService) {
    service.capability().then((x) => {
      this.capability.set(x);
    });
  }

  get ProtocolTypes() {
    return this.capability.get().then((x) => {
      return x.ProtocolTypes ?? [];
    });
  }
  get DeviceTypes() {
    return this.capability.get().then((x) => {
      return x.DeviceTypes ?? [];
    });
  }
  get AudioFormats() {
    return this.capability.get().then((x) => {
      return x.AudioFormats ?? [];
    });
  }
  get VideoFormats() {
    return this.capability.get().then((x) => {
      return x.VideoFormats ?? [];
    });
  }
  get DeviceStates() {
    return this.capability.get().then((x) => {
      return x.DeviceStates ?? [];
    });
  }
}
