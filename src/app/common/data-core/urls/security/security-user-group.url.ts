import { AbstractUrl } from '../abstract.url';
import { SecurityUserGroupDeviceUrl } from './security-user-group-device.url';
import { SecurityUserGroupVideoUrl } from './security-user-group-video.url';

export class SecurityUserGroupUrl extends AbstractUrl {
  constructor(private base: string) {
    super(`${base}/UserGroups`);
  }

  device(groupId: string) {
    return new SecurityUserGroupDeviceUrl(this.item(groupId));
  }

  video(groupId: string) {
    return new SecurityUserGroupVideoUrl(this.item(groupId));
  }
}
