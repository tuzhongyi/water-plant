import { AbstractUrl } from '../abstract.url';
import { BaseUrl } from '../base.url';

export class VideoAnalysisUrl {
  private static base = `${BaseUrl.data_service}/VideoAnalysis`;

  static capability() {
    return `${this.base}/Capability`;
  }

  static get device() {
    return new VideoAnalysisDeviceUrl(this.base);
  }
  static get task() {
    return new VideoAnalysisTaskUrl(this.base);
  }
}

class VideoAnalysisDeviceUrl extends AbstractUrl {
  constructor(base: string) {
    super(`${base}/Devices`);
  }
}

class VideoAnalysisTaskUrl extends AbstractUrl {
  constructor(base: string) {
    super(`${base}/Tasks`);
  }

  capability() {
    return `${this.basic()}/Capability`;
  }
  events() {
    return `${this.basic()}/Events`;
  }
  deploy() {
    return `${this.basic()}/Deploy`;
  }
  start(id: string) {
    return `${this.item(id)}/Start`;
  }
  stop(id: string) {
    return `${this.item(id)}/Stop`;
  }
  capturePicture() {
    return `${this.basic()}/CapturePicture`;
  }
}
