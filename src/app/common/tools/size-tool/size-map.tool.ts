export class SizeMapTool {
  shop = new Size(76 * 0.7, 86 * 0.7);
  point = {
    normal: new Size(48 * 0.7, 48 * 0.7),
    small: new Size(48 * 0.5, 48 * 0.5),
  };
  alarm = {
    small: new Size(60 * 0.1, 60 * 0.1),
    normal: new Size(60 * 0.5, 60 * 0.5),
  };
  device = {
    mobile: new Size(60 * 0.5, 60 * 0.5),
  };
  object = new Size(76 * 0.7, 86 * 0.7);
}
class Size {
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  width: number;
  height: number;
  get() {
    return [this.width, this.height] as [number, number];
  }
}
