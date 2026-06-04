import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';
import { ServiceTool } from '../../../../tools/service-tool/service.tool';

import { HowellResponse } from '../../../models/howell-response.model';
import { PagedList } from '../../../models/interface/page-list.model';

import { UserGroup } from '../../../models/security/user/user-group.model';
import { SecurityUrl } from '../../../urls/security/security.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { SecurityUserGroupDeviceRequestService } from './security-user-group-device.service';
import { SecurityUserGroupVideoRequestService } from './security-user-group-video-channel.service';
import { GetUserGroupsParams } from './security.params';

@Injectable({
  providedIn: 'root',
})
export class SecurityUserGroupRequestService {
  constructor(private http: HowellHttpClient) {}

  async create(data: UserGroup) {
    let url = SecurityUrl.user.group.basic();
    let _data = ObjectTool.serialize(data, UserGroup);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<UserGroup>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, UserGroup);
    });
  }
  async get(id: string) {
    let url = SecurityUrl.user.group.item(id);
    return this.http.get<HowellResponse<UserGroup>>(url).then((x) => {
      return HowellResponseProcess.item(x, UserGroup);
    });
  }
  async delete(id: string) {
    let url = SecurityUrl.user.group.item(id);
    return this.http.delete<HowellResponse<UserGroup>>(url).then((x) => {
      return HowellResponseProcess.item(x, UserGroup);
    });
  }
  async update(data: UserGroup) {
    let url = SecurityUrl.user.group.item(data.Id);
    let _data = ObjectTool.serialize(data, UserGroup);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<UserGroup>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, UserGroup);
    });
  }
  async list(params = new GetUserGroupsParams()) {
    let url = SecurityUrl.user.group.list();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<PagedList<UserGroup>>, any>(url, plain).then((x) => {
      return HowellResponseProcess.paged(x, UserGroup);
    });
  }
  all(params = new GetUserGroupsParams()): Promise<UserGroup[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }

  private _device?: SecurityUserGroupDeviceRequestService;
  public get device(): SecurityUserGroupDeviceRequestService {
    if (!this._device) {
      this._device = new SecurityUserGroupDeviceRequestService(this.http);
    }
    return this._device;
  }

  private _video?: SecurityUserGroupVideoRequestService;
  public get video(): SecurityUserGroupVideoRequestService {
    if (!this._video) {
      this._video = new SecurityUserGroupVideoRequestService(this.http);
    }
    return this._video;
  }
}
