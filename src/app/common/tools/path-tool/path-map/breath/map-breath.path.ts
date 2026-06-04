export class MapBreathPath {
  constructor(path: string) {
    this.basic = `${path}/breath`;
  }

  private basic: string;

  get red() {
    return `${this.basic}_red.png`;
  }
  get orange() {
    return `${this.basic}_orange.png`;
  }
  get cyan() {
    return `${this.basic}_cyan.png`;
  }
}
