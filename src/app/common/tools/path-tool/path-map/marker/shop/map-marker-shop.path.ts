import { MapMarkerPathInstance } from '../map-marker.path.abstract';

export class MapMarkerShopPath {
  constructor(path: string) {
    this.basic = `${path}/marker-shop`;
  }

  private basic: string;

  get white() {
    return new MapMarkerPathInstance(`${this.basic}-white`);
  }
  get green() {
    return new MapMarkerPathInstance(`${this.basic}-green`);
  }
  get orange() {
    return new MapMarkerPathInstance(`${this.basic}-orange`);
  }
  get blue() {
    return new MapMarkerPathInstance(`${this.basic}-blue`);
  }
  get red() {
    return new MapMarkerPathInstance(`${this.basic}-red`);
  }
}
