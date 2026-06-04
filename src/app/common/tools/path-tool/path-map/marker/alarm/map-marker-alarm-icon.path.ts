export class MapMarkerAlarmIconPath {
  constructor(path: string) {
    this.basic = `${path}`;
  }

  private basic: string;

  get blue() {
    return `${this.basic}-blue.png`;
  }
  get cyan() {
    return `${this.basic}-cyan.png`;
  }
  get green() {
    return `${this.basic}-green.png`;
  }
  get orange() {
    return `${this.basic}-orange.png`;
  }
  get red() {
    return `${this.basic}-red.png`;
  }
}
