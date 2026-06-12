import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { PathTool } from '../../../../tools/path-tool/path.tool';
import { ApiConfigResponse } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  /** 读取配置：优先 localStorage，否则加载 public/config.json */
  getConfig(): Observable<ApiConfigResponse> {
    return from(fetch(PathTool.three.json.config.global).then((r) => r.json()));
  }
}
