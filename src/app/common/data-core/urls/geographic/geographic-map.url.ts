import { AbstractUrl } from '../abstract.url';
import { GeographicMapElementUrl } from './geographic-map-element.url';

export class GeographicMapUrl extends AbstractUrl {
  constructor(private base: string) {
    super(`${base}/Maps`);
  }

  get element() {
    return new GeographicMapElementUrl(this.base);
  }
}
