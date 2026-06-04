import { SizeMapTool } from './size-map.tool';
import { SizeWindowTool } from './size-window.tool';

export class SizeTool {
  static window = new SizeWindowTool();
  static map = new SizeMapTool();
}
