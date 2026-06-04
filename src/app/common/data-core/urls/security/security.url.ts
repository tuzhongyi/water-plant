import { AbstractUrl } from '../abstract.url';
import { BaseUrl } from '../base.url';
import { SecurityUserUrl } from './security-user.url';

export class SecurityUrl extends AbstractUrl {
  private static base = `${BaseUrl.data_service}/Security`;

  static get user() {
    return new SecurityUserUrl(this.base);
  }

  static login() {
    return `${this.base}/Login`;
  }
}
