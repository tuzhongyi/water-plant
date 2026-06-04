import { AbstractUrl } from '../abstract.url';
import { BaseUrl } from '../base.url';
import { DeviceFaceUrl } from './device-face-snap.url';
import { DeviceVideoChannelUrl } from './device-video-channel.url';

export class DeviceBaseUrl extends AbstractUrl {
  constructor(base: string) {
    super(base);
  }
}

export class DeviceUrl extends AbstractUrl {
  private static base = new DeviceBaseUrl(`${BaseUrl.data_service}/Devices`);

  static basic(): string {
    return this.base.basic();
  }
  static create(channel: boolean) {
    return `${this.basic()}?CreateVideoChannel=${channel}`;
  }
  static item<T = string>(id: T) {
    return this.base.item(id);
  }
  static list() {
    return this.base.list();
  }

  static video = {
    channel: (deviceId?: string) => {
      let url = deviceId ? this.item(deviceId) : this.basic();
      return new DeviceVideoChannelUrl(url);
    },
  };
  static get face() {
    return new DeviceFaceUrl(this.basic());
  }

  static searching() {
    return `${this.basic()}/Searching`;
  }

  static url = {
    preview: () => {
      return `${this.basic()}/PreviewUrls`;
    },
    vod: () => {
      return `${this.basic()}/VodUrls`;
    },
  };

  static capability() {
    return `${this.basic()}/Capability`;
  }
}
