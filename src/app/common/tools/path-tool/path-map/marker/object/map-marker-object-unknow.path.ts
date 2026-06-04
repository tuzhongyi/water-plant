import { MapMarkerPathInstance } from '../map-marker.path.abstract';

export class MapMarkerObjectUnknowPath {
  constructor(base: string) {
    this.basic = `${base}/unknow/marker-unknow`;
  }

  private basic: string;

  get gray() {
    return new MapMarkerPathInstance(`${this.basic}-gray`);
  }
  get green() {
    return new MapMarkerPathInstance(`${this.basic}-green`);
  }
}
