import { AbstractUrl } from '../abstract.url';

export class DB31ChannelUrl extends AbstractUrl {
  constructor(base: string) {
    super(`${base}/Channels`);
  }
}
