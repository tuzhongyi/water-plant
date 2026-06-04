import { MapMarkerPathInstance } from '../map-marker.path.abstract';
import { IMapMarkerObjectPath } from './map-marker-object.interface';

export class MapMarkerObjectBusStationPath extends IMapMarkerObjectPath {
  constructor(base: string) {
    super();
    this.basic = `${base}/bus-station/marker-bus-station`;
  }

  private basic: string;

  get blue() {
    return new MapMarkerPathInstance(`${this.basic}-blue`);
  }
  get red() {
    return new MapMarkerPathInstance(`${this.basic}-red`);
  }
  get orange() {
    return new MapMarkerPathInstance(`${this.basic}-orange`);
  }
  get gray() {
    return new MapMarkerPathInstance(`${this.basic}-gray`);
  }
  get green() {
    return new MapMarkerPathInstance(`${this.basic}-green`);
  }
  get cyan() {
    return new MapMarkerPathInstance(`${this.basic}-cyan`);
  }
}
