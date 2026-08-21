import { BaseUrl } from '../base.url';

export class MediumUrl {
  private static base = `${BaseUrl.data_service}/Medium`;

  static picture() {
    return `${this.base}/Pictures`;
  }
  static pictureItem<T = string>(id: T) {
    return `${this.picture()}/${id}`;
  }
  static file(id: string, fileName: string) {
    return `${this.base}/Files/${id}/${fileName}`;
  }
}
