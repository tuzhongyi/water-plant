import { Injectable } from '@angular/core';
import { ConfigRequestService } from '../../data-core/request/config/config-request.service';
import { ConfigPath } from './config.path';
import { ThreePathTool } from './path-3d/3d.path';
import { SkinPathImageTool } from './path-image.tool';
import { MarkerPathTool } from './path-marker/marker.path';

@Injectable({ providedIn: 'root' })
export class PathTool {
  static image = new SkinPathImageTool();
  static config = new ConfigPath();
  static record(url: string = '') {
    return `api/ver10/${url}`;
  }
  static three = new ThreePathTool();

  constructor(private config: ConfigRequestService) {}

  get marker() {
    return this.config.get().then((x) => {
      return new MarkerPathTool(x.skin);
    });
  }
}
