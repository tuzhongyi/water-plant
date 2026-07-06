import { IMarkerPath } from './marker.interface';

export abstract class MarkerPathAbstract implements IMarkerPath {
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

  equals(other: IMarkerPath): boolean {
    return this.normal === other.normal;
  }
}

export class MarkerPathInstance extends MarkerPathAbstract {
  constructor(path: string) {
    super(`${path}`);
  }
}
