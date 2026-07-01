import { BaseUrl } from '../base.url';
import { DB31ChannelUrl } from './db31-channel';
import { DB31DeviceUrl } from './db31-device.url';

export class DB31Url {
  private static base = `${BaseUrl.data_service}/DB31`;

  static get device() {
    return new DB31DeviceUrl(this.base);
  }
  static get channel() {
    return new DB31ChannelUrl(this.base);
  }

  static capability() {
    return `${this.base}/Capability`;
  }
}
