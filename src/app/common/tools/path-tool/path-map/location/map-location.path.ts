export class MapLocationPath {
  constructor(path: string) {
    this.basic = `${path}/location`;
  }

  private basic: string;

  get point() {
    return `${this.basic}.png`;
  }
  get arrow() {
    return `${this.basic}-arrow.png`;
  }
}
