import { AbstractUrl } from '../abstract.url';

export class DeviceVideoChannelViewGroupUrl extends AbstractUrl {
  constructor(base: string) {
    super(`${base}/ViewGroups`);
  }
}
