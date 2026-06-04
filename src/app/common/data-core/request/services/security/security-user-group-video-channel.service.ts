import { instanceToPlain } from 'class-transformer';

import { HowellResponse } from '../../../models/howell-response.model';

import { IdAndName } from '../../../models/common/id-name.model';
import { SecurityUrl } from '../../../urls/security/security.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';

class SecurityUserGroupVideoChannelRequestService {
  constructor(private http: HowellHttpClient) {}

  async array(groupId: string) {
    let url = SecurityUrl.user.group.video(groupId).channel.basic();
    return this.http.get<HowellResponse<IdAndName[]>>(url).then((x) => {
      return HowellResponseProcess.array(x, IdAndName);
    });
  }
  async delete(groupId: string, datas: IdAndName[]) {
    let url = SecurityUrl.user.group.video(groupId).channel.delete();
    let plain = instanceToPlain(datas);
    return this.http.post<HowellResponse<IdAndName[]>, any>(url, plain).then((x) => {
      return HowellResponseProcess.array(x, IdAndName);
    });
  }
  async update(groupId: string, datas: IdAndName[]) {
    let url = SecurityUrl.user.group.video(groupId).channel.basic();
    let plain = instanceToPlain(datas);
    return this.http.put<any, HowellResponse<IdAndName[]>>(url, plain).then((x) => {
      return HowellResponseProcess.array(x, IdAndName);
    });
  }
}
export class SecurityUserGroupVideoRequestService {
  constructor(private http: HowellHttpClient) {}

  private _channel?: SecurityUserGroupVideoChannelRequestService;
  public get channel(): SecurityUserGroupVideoChannelRequestService {
    if (!this._channel) {
      this._channel = new SecurityUserGroupVideoChannelRequestService(this.http);
    }
    return this._channel;
  }
}
