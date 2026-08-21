import { BaseUrl } from '../base.url';

export class RegionUrl {
  private static base = `${BaseUrl.data_service}/Regions`;

  static basic() {
    return this.base;
  }
  static item<T = string>(id: T) {
    return `${this.base}/${id}`;
  }
  static list() {
    return `${this.base}/List`;
  }
  static capability() {
    return `${this.base}/Capability`;
  }
  static treeNodes() {
    return `${this.base}/TreeNodes`;
  }

  static get resource() {
    return new RegionResourceUrl(this.base);
  }
}

class RegionResourceUrl {
  constructor(private base: string) {}

  basic() {
    return `${this.base}/Resources`;
  }
  list() {
    return `${this.basic()}/List`;
  }
  item(regionId: string, resourceId: string) {
    return `${this.base}/${regionId}/Resources/${resourceId}`;
  }
}
