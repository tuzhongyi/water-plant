import { AbstractUrl } from '../abstract.url';

export class DeviceFaceUrl {
  constructor(private base: string) {}

  get snap() {
    return new DeviceFaceSnapUrl(this.base);
  }
}

class DeviceFaceSnapUrl extends AbstractUrl {
  constructor(base: string) {
    super(`${base}/FaceSnaps`);
  }

  settings() {
    return `${this.basic()}/Settings`;
  }

  image(id: string) {
    return `${this.basic()}/Images/${id}`;
  }
}
