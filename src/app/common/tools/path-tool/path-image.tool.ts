import { PathImageChartTool } from './path-image-chart.tool';
import { PathImageSVGTool } from './path-image-svg.tool';
import { PathImageSystemModuleTool } from './path-image-sytem-module/path-image-system-module.tool';
import { MapPath } from './path-map/map.path';

export class PathImageTool {
  // map = new PathImageMapTool();
  map = new MapPath();
  chart = new PathImageChartTool();
  svg = new PathImageSVGTool();

  system = {
    module: new PathImageSystemModuleTool(),
  };
}
