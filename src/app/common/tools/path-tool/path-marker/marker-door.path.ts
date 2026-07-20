import { IMarkerOffline, IMarkerPath } from './marker.interface';
import { MarkerPathInstance } from './marker.path.abstract';

export class MarkerDoorPath extends MarkerPathInstance implements IMarkerPath, IMarkerOffline {
  constructor(base: string) {
    super(`${base}/door`);
  }
  get offline(): string {
    return `${this.basic}-offline.png`;
  }

  get alarm() {
    return new MarkerPathInstance(`${this.basic}-alarm`);
  }
}
