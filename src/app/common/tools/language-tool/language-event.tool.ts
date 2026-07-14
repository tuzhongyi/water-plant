import { EventCapability } from '../../data-core/models/events/event.capability';
import { EventRequestService } from '../../data-core/request/services/event/event.service';
import { PromiseValue } from '../value-tool/value.promise';

export class LanguageEventTool {
  constructor(service: EventRequestService) {
    this.init(service);
  }
  private capability = new PromiseValue<EventCapability>();

  private init(service: EventRequestService) {
    service.capability().then((x) => {
      this.capability.set(x);
    });
  }

  async EventTypes(value?: number, def = '') {
    let capability = await this.capability.get();
    let state = capability.EventTypes?.find((x) => x.Value == value);
    if (state) {
      return state.Name;
    }
    return def;
  }
  async ResourceTypes(value?: number, def = '') {
    let capability = await this.capability.get();
    let state = capability.ResourceTypes?.find((x) => x.Value == value);
    if (state) {
      return state.Name;
    }
    return def;
  }
  async TriggerTypes(value?: number, def = '') {
    let capability = await this.capability.get();
    let state = capability.TriggerTypes?.find((x) => x.Value == value);
    if (state) {
      return state.Name;
    }
    return def;
  }
  async BehaviorTypes(value?: number, def = '') {
    let capability = await this.capability.get();
    let state = capability.BehaviorTypes?.find((x) => x.Value == value);
    if (state) {
      return state.Name;
    }
    return def;
  }
}
