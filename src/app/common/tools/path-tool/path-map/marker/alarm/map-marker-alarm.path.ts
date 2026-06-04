import { MapMarkerAlarmIconPath } from './map-marker-alarm-icon.path';

export class MapMarkerAlarmPath {
  constructor(path: string) {
    this.basic = `${path}/marker-alarm`;
  }

  private basic: string;

  get icon() {
    return new MapMarkerAlarmIconPath(this.basic);
  }
  get info() {
    return {
      red: `${this.basic}-info.png`,
    };
  }
}
