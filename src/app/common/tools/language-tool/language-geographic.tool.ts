import { GeographicCapability } from '../../data-core/models/geographic/geographic.capability';
import { GeographicRequestService } from '../../data-core/request/services/geographic/geographic.service';
import { PromiseValue } from '../value-tool/value.promise';

export class LanguageGeographicTool {
  constructor(service: GeographicRequestService) {
    this.init(service);
  }
  private capability = new PromiseValue<GeographicCapability>();

  private init(service: GeographicRequestService) {
    service.capability().then((x) => {
      this.capability.set(x);
    });
  }

  async ElementType(value?: number, def = '') {
    let capability = await this.capability.get();
    let state = capability.ElementTypes?.find((x) => x.Value == value);
    if (state) {
      return state.Name;
    }
    return def;
  }
  async ElementStates(value?: number, def = '') {
    let capability = await this.capability.get();
    let state = capability.ElementStates?.find((x) => x.Value == value);
    if (state) {
      return state.Name;
    }
    return def;
  }
}
