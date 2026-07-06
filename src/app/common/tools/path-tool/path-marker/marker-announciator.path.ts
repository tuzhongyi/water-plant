import { IMarkerOffline, IMarkerPath } from './marker.interface';
import { MarkerPathInstance } from './marker.path.abstract';

export class MarkerAnnounciatorPath
  extends MarkerPathInstance
  implements IMarkerPath, IMarkerOffline
{
  constructor(base: string) {
    super(`${base}/announciator`);
  }
  get offline(): string {
    return `${this.basic}-offline.png`;
  }

  get alarm() {
    return new MarkerPathInstance(`${this.basic}-alarm`);
  }
}
