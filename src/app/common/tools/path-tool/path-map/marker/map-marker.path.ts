import { MapMarkerAlarmPath } from './alarm/map-marker-alarm.path';
import { MapMarkerDevicePath } from './device/map-marker-device.path';
import { MapMarkerObjectPath } from './object/map-marker-object.path';
import { MapMarkerShopPath } from './shop/map-marker-shop.path';

export class MapMarkerPath {
  constructor(path: string) {
    this.basic = `${path}/marker`;
  }

  private basic: string;

  get object() {
    return new MapMarkerObjectPath(this.basic);
  }

  get shop() {
    return new MapMarkerShopPath(this.basic);
  }
  get alarm() {
    return new MapMarkerAlarmPath(this.basic);
  }
  get device() {
    return new MapMarkerDevicePath(this.basic);
  }
}
