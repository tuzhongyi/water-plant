import { AbstractUrl } from '../abstract.url';
import { SecurityUserGroupUrl } from './security-user-group.url';

export class SecurityUserUrl extends AbstractUrl {
  constructor(private base: string) {
    super(`${base}/Users`);
  }

  get group() {
    return new SecurityUserGroupUrl(this.base);
  }
}
