export class MapMarkerDevicePath {
  constructor(path: string) {
    this.basic = `${path}/marker-device`;
  }

  private basic: string;

  get mobile() {
    return {
      online: `${this.basic}-mobile-online.png`,
      offline: `${this.basic}-mobile-offline.png`,
    };
  }
}
