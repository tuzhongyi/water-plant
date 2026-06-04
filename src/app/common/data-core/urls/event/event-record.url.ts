import { AbstractUrl } from '../abstract.url';

export class EventRecordUrl extends AbstractUrl {
  constructor(base: string) {
    super(`${base}/Records`);
  }
}
