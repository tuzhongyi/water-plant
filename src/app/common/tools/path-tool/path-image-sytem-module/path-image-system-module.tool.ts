export class PathImageSystemModuleTool {
  constructor(node: string = '') {
    this.base = `${node}/assets/image/system/module/system-module-icon`;
  }

  private base: string;

  get shop() {
    return `${this.base}-shop.png`;
  }
  get road() {
    return `${this.base}-road.png`;
  }
  get gps() {
    return `${this.base}-gps.png`;
  }
  get analysis() {
    return `${this.base}-analysis.png`;
  }
  get road_object() {
    return `${this.base}-road-object.png`;
  }
}
