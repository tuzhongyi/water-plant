import { AbstractUrl } from '../abstract.url';

export class DB31DeviceUrl extends AbstractUrl {
  constructor(base: string) {
    super(`${base}/Devices`);
  }
}
