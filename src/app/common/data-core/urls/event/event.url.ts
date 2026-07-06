import { AbstractUrl } from '../abstract.url';
import { BaseUrl } from '../base.url';
import { EventRecordUrl } from './event-record.url';

export class EventUrl extends AbstractUrl {
  private static base = `${BaseUrl.data_service}/Events`;

  static get record() {
    return new EventRecordUrl(this.base);
  }

  static capability() {
    return `${this.base}/Capability`;
  }
}
