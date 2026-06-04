import { AbstractUrl } from '../abstract.url';

export class SecurityUserGroupVideoUrl {
  constructor(private base: string) {}

  get channel() {
    return new SecurityUserGroupVideoChannelUrl(this.base);
  }
}
export class SecurityUserGroupVideoChannelUrl extends AbstractUrl {
  constructor(base: string) {
    super(`${base}/VideoChannels`);
  }

  delete() {
    return `${this.basic()}/Delete`;
  }
}
