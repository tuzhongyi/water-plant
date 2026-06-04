import { AbstractUrl } from '../abstract.url';

export class SecurityUserGroupDeviceUrl extends AbstractUrl {
  constructor(base: string) {
    super(`${base}/Devices`);
  }

  delete() {
    return `${this.basic()}/Delete`;
  }
}
