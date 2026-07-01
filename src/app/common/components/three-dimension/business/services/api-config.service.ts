import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { PathTool } from '../../../../tools/path-tool/path.tool';
import { ApiConfigResponse, ModelFile } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  /** 读取配置 */
  getConfig(): Observable<ApiConfigResponse> {
    const url = `${PathTool.three.json.config.global}?t=${Date.now()}`;
    return from(fetch(url).then((r) => r.json()));
  }

  models(): Observable<ModelFile[]> {
    let url = `${PathTool.three.json.models}?t=${Date.now()}`;
    return from(fetch(url).then((r) => r.json()));
  }
}
