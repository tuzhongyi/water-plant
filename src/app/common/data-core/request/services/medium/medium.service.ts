import { Injectable } from '@angular/core';

import { HowellResponse } from '../../../models/howell-response.model';
import { MediumUrl } from '../../../urls/medium/medium.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';

@Injectable({
  providedIn: 'root',
})
export class MediumRequestService {
  constructor(private http: HowellHttpClient) {}

  /** 创建图片数据 */
  create(data: FormData) {
    let url = MediumUrl.picture();
    return this.http.post<HowellResponse<string>, any>(url, data).then((x) => {
      return HowellResponseProcess.data(x);
    });
  }

  /** 获取图片数据 */
  picture(id: string) {
    let url = MediumUrl.pictureItem(id);
    return this.http.blob(url, 'image/jpeg');
  }

  /** 获取视频文件 */
  file(id: string, fileName: string) {
    let url = MediumUrl.file(id, fileName);
    return this.http.blob(url, 'video/x-matroska');
  }
}
