import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';
import { ServiceTool } from '../../../../tools/service-tool/service.tool';

import { HowellResponse } from '../../../models/howell-response.model';
import { PagedList } from '../../../models/interface/page-list.model';

import { User } from '../../../models/security/user/user.model';
import { SecurityUrl } from '../../../urls/security/security.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { SecurityUserGroupRequestService } from './security-user-group.service';
import { GetUsersParams } from './security.params';

@Injectable({
  providedIn: 'root',
})
export class SecurityUserRequestService {
  constructor(private http: HowellHttpClient) {}

  async create(data: User) {
    let url = SecurityUrl.user.basic();
    let _data = ObjectTool.serialize(data, User);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<User>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, User);
    });
  }
  async get(id: string) {
    let url = SecurityUrl.user.item(id);
    return this.http.get<HowellResponse<User>>(url).then((x) => {
      return HowellResponseProcess.item(x, User);
    });
  }
  async delete(id: string) {
    let url = SecurityUrl.user.item(id);
    return this.http.delete<HowellResponse<User>>(url).then((x) => {
      return HowellResponseProcess.item(x, User);
    });
  }
  async update(data: User) {
    let url = SecurityUrl.user.item(data.Id);
    let _data = ObjectTool.serialize(data, User);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<User>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, User);
    });
  }
  async list(params = new GetUsersParams()) {
    let url = SecurityUrl.user.list();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<PagedList<User>>, any>(url, plain).then((x) => {
      return HowellResponseProcess.paged(x, User);
    });
  }
  all(params = new GetUsersParams()): Promise<User[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }

  private _group?: SecurityUserGroupRequestService;
  public get group(): SecurityUserGroupRequestService {
    if (!this._group) {
      this._group = new SecurityUserGroupRequestService(this.http);
    }
    return this._group;
  }
}
