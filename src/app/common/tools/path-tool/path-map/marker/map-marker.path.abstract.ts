import { IMapMarkerPath } from './map-marker.interface';

export abstract class MapMarkerPathAbstract implements IMapMarkerPath {
  constructor(base: string) {
    this.basic = `${base}`;
  }

  protected basic: string;

  get normal() {
    return `${this.basic}.png`;
  }
  get selected() {
    return `${this.basic}-selected.png`;
  }
  get hover() {
    return `${this.basic}-hover.png`;
  }

  equals(other: IMapMarkerPath): boolean {
    return this.normal === other.normal;
  }
}

export class MapMarkerPathInstance extends MapMarkerPathAbstract {
  constructor(path: string) {
    super(`${path}`);
  }
}

export class MapLineStartMarkerPath implements IMapMarkerPath {
  constructor(base: string) {
    this.basic = `${base}`;
  }

  protected basic: string;

  get normal() {
    return `${this.basic}-0.png`;
  }
  get selected() {
    return `${this.basic}-1.png`;
  }
  get hover() {
    return `${this.basic}-2.png`;
  }

  equals(other: IMapMarkerPath): boolean {
    return this.normal === other.normal;
  }
}
export class MapLineEndMarkerPath implements IMapMarkerPath {
  constructor(base: string) {
    this.basic = `${base}`;
  }

  protected basic: string;

  get normal() {
    return `${this.basic}-1.png`;
  }
  get selected() {
    return `${this.basic}-2.png`;
  }
  get hover() {
    return `${this.basic}-3.png`;
  }

  equals(other: IMapMarkerPath): boolean {
    return this.normal === other.normal;
  }
}
