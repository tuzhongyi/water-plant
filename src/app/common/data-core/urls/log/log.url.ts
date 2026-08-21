import { BaseUrl } from '../base.url';

export class LogUrl {
  private static base = `${BaseUrl.data_service}/Logs`;

  static basic() {
    return `${this.base}/Records`;
  }
  static item<T = string>(id: T) {
    return `${this.basic()}/${id}`;
  }
  static list() {
    return `${this.basic()}/List`;
  }
  static capability() {
    return `${this.base}/Capability`;
  }
}
