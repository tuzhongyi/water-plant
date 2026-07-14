import { EventCapability } from '../../data-core/models/events/event.capability';
import { EventRequestService } from '../../data-core/request/services/event/event.service';
import { PromiseValue } from '../value-tool/value.promise';

export class CapabilityEventTool {
  constructor(service: EventRequestService) {
    this.init(service);
  }
  private capability = new PromiseValue<EventCapability>();

  private init(service: EventRequestService) {
    service.capability().then((x) => {
      this.capability.set(x);
    });
  }

  get EventTypes() {
    return this.capability.get().then((x) => {
      return x.EventTypes ?? [];
    });
  }
  get ResourceTypes() {
    return this.capability.get().then((x) => {
      return x.ResourceTypes ?? [];
    });
  }
  get TriggerTypes() {
    return this.capability.get().then((x) => {
      return x.TriggerTypes ?? [];
    });
  }
  get BehaviorTypes() {
    return this.capability.get().then((x) => {
      return x.BehaviorTypes ?? [];
    });
  }
}
