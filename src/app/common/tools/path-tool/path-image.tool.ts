import { PathImageSVGTool } from './path-image-svg.tool';
import { PathImageSystemModuleTool } from './path-image-sytem-module/path-image-system-module.tool';

export class SkinPathImageTool {
  constructor(path: string = '') {
    this.basic = `${path}assets/images`;
  }
  private basic: string;

  get blue() {
    return new PathImageTool(`${this.basic}/blue`);
  }
  get green() {
    return new PathImageTool(`${this.basic}/green`);
  }
}

class PathImageTool {
  constructor(path: string = '') {
    this.svg = new PathImageSVGTool(path);
    this.system = {
      module: new PathImageSystemModuleTool(path),
    };
  }

  svg: PathImageSVGTool;
  system: { module: PathImageSystemModuleTool };
}
