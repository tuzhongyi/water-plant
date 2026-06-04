import {
  MapLineEndMarkerPath,
  MapLineStartMarkerPath,
} from '../map-marker.path.abstract';
import { IMapMarkerObjectPath } from './map-marker-object.interface';

export class MapMarkerObjectNoParkingPath {
  constructor(base: string) {
    this.basic = `${base}/no-parking/marker-no-parking`;
  }

  private basic: string;

  get start() {
    return new StartPath(`${this.basic}`);
  }
  get end() {
    return new EndPath(`${this.basic}`);
  }
}
class StartPath extends IMapMarkerObjectPath {
  constructor(base: string) {
    super();
    this.basic = `${base}`;
  }

  private basic: string;

  get blue() {
    return new MapLineStartMarkerPath(`${this.basic}-blue`);
  }
  get red() {
    return new MapLineStartMarkerPath(`${this.basic}-red`);
  }
  get orange() {
    return new MapLineStartMarkerPath(`${this.basic}-orange`);
  }
  get gray() {
    return new MapLineStartMarkerPath(`${this.basic}-gray`);
  }
  get green() {
    return new MapLineStartMarkerPath(`${this.basic}-green`);
  }
  get cyan() {
    return new MapLineStartMarkerPath(`${this.basic}-cyan`);
  }
}
class EndPath extends IMapMarkerObjectPath {
  constructor(base: string) {
    super();
    this.basic = `${base}`;
  }

  private basic: string;

  get blue() {
    return new MapLineEndMarkerPath(`${this.basic}-blue`);
  }
  get red() {
    return new MapLineEndMarkerPath(`${this.basic}-red`);
  }
  get orange() {
    return new MapLineEndMarkerPath(`${this.basic}-orange`);
  }
  get gray() {
    return new MapLineEndMarkerPath(`${this.basic}-gray`);
  }
  get green() {
    return new MapLineEndMarkerPath(`${this.basic}-green`);
  }
  get cyan() {
    return new MapLineEndMarkerPath(`${this.basic}-cyan`);
  }
}
