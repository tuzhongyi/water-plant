import { AbstractUrl } from '../abstract.url';

export class DeviceVideoChannelUrl extends AbstractUrl {
  constructor(base: string) {
    super(`${base}/VideoChannels`);
  }

  picture(id: string) {
    return `${this.item(id)}/GetPicture`;
  }

  ptz(id: string) {
    return `${this.item(id)}/PTZControl`;
  }
}
