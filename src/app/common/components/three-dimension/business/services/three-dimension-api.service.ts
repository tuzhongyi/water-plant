import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { PathTool } from '../../../../tools/path-tool/path.tool';
import { ModelFile, RenderMode, ThreeDimensionConfig } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ThreeDimensionApiService {
  /** 读取配置 */
  config(mode: RenderMode): Observable<ThreeDimensionConfig> {
    const url = `${PathTool.three.json.config(mode)}?t=${Date.now()}`;
    return from(
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          return data as ThreeDimensionConfig;
        }),
    );
  }

  models(mode: RenderMode): Observable<ModelFile[]> {
    let url = `${PathTool.three.json.models(mode)}?t=${Date.now()}`;
    return from(
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          const arr = data as ModelFile[];
          return arr;
        }),
    );
  }

  model = {
    all: (mode: RenderMode) => {
      let url = `${PathTool.three.json.models(mode)}?t=${Date.now()}`;
      return from(fetch(url).then((r) => r.json()));
    },
    file: (mode: RenderMode, filename: string) => {
      let url = `${PathTool.three.get.file(mode, filename)}?t=${Date.now()}`;
      return from(fetch(url).then((r) => r.json()));
    },
  };
}
