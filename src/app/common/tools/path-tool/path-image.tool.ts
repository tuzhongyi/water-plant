import { PathImageChartTool } from './path-image-chart.tool';
import { PathImageSVGTool } from './path-image-svg.tool';
import { PathImageSystemModuleTool } from './path-image-sytem-module/path-image-system-module.tool';

export class PathImageTool {
  chart = new PathImageChartTool();
  svg = new PathImageSVGTool();

  system = {
    module: new PathImageSystemModuleTool(),
  };
}
