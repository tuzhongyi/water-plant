import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { PathTool } from '../../../../tools/path-tool/path.tool';
import { ModelFile, ThreeDimensionConfig } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ThreeDimensionApiService {
  /** 读取配置 */
  config(): Observable<ThreeDimensionConfig> {
    const url = `${PathTool.three.json.config.global}?t=${Date.now()}`;
    return from(fetch(url).then((r) => r.json()));
  }

  models(): Observable<ModelFile[]> {
    let url = `${PathTool.three.json.models}?t=${Date.now()}`;
    return from(fetch(url).then((r) => r.json()));
  }

  model = {
    all: () => {
      let url = `${PathTool.three.json.models}?t=${Date.now()}`;
      return from(fetch(url).then((r) => r.json()));
    },
    file: (filename: string) => {
      let url = `${PathTool.three.get.file(filename)}?t=${Date.now()}`;
      return from(fetch(url).then((r) => r.json()));
    },
  };
}
