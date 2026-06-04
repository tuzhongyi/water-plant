import { AbstractUrl } from '../abstract.url';
import { BaseUrl } from '../base.url';
import { GeographicMapUrl } from './geographic-map.url';

export class GeographicUrl extends AbstractUrl {
  private static base = `${BaseUrl.data_service}/Geographic`;

  static get map() {
    return new GeographicMapUrl(this.base);
  }
}
