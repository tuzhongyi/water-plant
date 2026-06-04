export class MapPointPath {
  constructor(path: string) {
    this.basic = `${path}/point`;
  }

  private basic: string;

  get red() {
    return `${this.basic}-red.png`;
  }
  get blue() {
    return `${this.basic}-blue.png`;
  }
}
