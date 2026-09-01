import { Injectable } from '@angular/core';
import { GlobalStorage } from '../../storage/global.storage';
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

  constructor(private global: GlobalStorage) {}

  get marker() {
    return this.global.skin.then((skin) => {
      return new MarkerPathTool(skin);
    });
  }
}
