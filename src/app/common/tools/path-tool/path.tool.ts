import { ConfigPath } from './config.path';
import { ThreePathTool } from './path-3d/3d.path';
import { PathImageTool } from './path-image.tool';
import { MarkerPathTool } from './path-marker/marker.path';

export class PathTool {
  static image = new PathImageTool();
  static config = new ConfigPath();
  static record(url: string = '') {
    return `api/ver10/${url}`;
  }
  static three = new ThreePathTool();
  static marker = new MarkerPathTool();
}
