import { instanceToPlain } from 'class-transformer';

import { HowellResponse } from '../../../models/howell-response.model';

import { IdAndName } from '../../../models/common/id-name.model';
import { SecurityUrl } from '../../../urls/security/security.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';

export class SecurityUserGroupDeviceRequestService {
  constructor(private http: HowellHttpClient) {}

  async array(groupId: string) {
    let url = SecurityUrl.user.group.device(groupId).basic();
    return this.http.get<HowellResponse<IdAndName[]>>(url).then((x) => {
      return HowellResponseProcess.array(x, IdAndName);
    });
  }
  async delete(groupId: string, datas: IdAndName[]) {
    let url = SecurityUrl.user.group.device(groupId).delete();
    let plain = instanceToPlain(datas);
    return this.http.post<HowellResponse<IdAndName[]>, any>(url, plain).then((x) => {
      return HowellResponseProcess.array(x, IdAndName);
    });
  }
  async update(groupId: string, datas: IdAndName[]) {
    let url = SecurityUrl.user.group.device(groupId).basic();
    let plain = instanceToPlain(datas);
    return this.http.put<any, HowellResponse<IdAndName[]>>(url, plain).then((x) => {
      return HowellResponseProcess.array(x, IdAndName);
    });
  }
}
