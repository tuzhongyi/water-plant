import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../../tools/object-tool/object.tool';

import { HowellResponse } from '../../../../models/howell-response.model';

import { DB31Channel } from '../../../../models/db31/db31-channel.model';
import { PagedList } from '../../../../models/interface/page-list.model';
import { DB31Url } from '../../../../urls/db31/db31.url';
import { Cache } from '../../../cache/cache';
import { AbstractService } from '../../../cache/cache.interface';
import { HowellHttpClient } from '../../howell-http.client';
import { HowellResponseProcess } from '../../service-process';
import { GetDB31DeviceChannelsParams } from './db31-channel.params';

@Injectable({
  providedIn: 'root',
})
@Cache(DB31Url.channel.basic(), DB31Channel)
export class DB31ChannelRequestService extends AbstractService<DB31Channel> {
  constructor(private http: HowellHttpClient) {
    super();
  }
  async array() {
    let url = DB31Url.channel.basic();
    return this.http.get<HowellResponse<DB31Channel[]>>(url).then((x) => {
      return HowellResponseProcess.array(x, DB31Channel);
    });
  }
  async create(data: DB31Channel) {
    let url = DB31Url.channel.basic();
    let _data = ObjectTool.serialize(data, DB31Channel);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<DB31Channel>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, DB31Channel);
    });
  }
  async get(id: string) {
    let url = DB31Url.channel.item(id);
    return this.http.get<HowellResponse<DB31Channel>>(url).then((x) => {
      return HowellResponseProcess.item(x, DB31Channel);
    });
  }
  async delete(id: string) {
    let url = DB31Url.channel.item(id);
    return this.http.delete<HowellResponse<DB31Channel>>(url).then((x) => {
      return HowellResponseProcess.item(x, DB31Channel);
    });
  }
  async update(data: DB31Channel) {
    let url = DB31Url.channel.item(data.Id);
    let _data = ObjectTool.serialize(data, DB31Channel);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<DB31Channel>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, DB31Channel);
    });
  }
  async list(params = new GetDB31DeviceChannelsParams()) {
    let url = DB31Url.channel.list();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<PagedList<DB31Channel>>, any>(url, plain).then((x) => {
      return HowellResponseProcess.paged(x, DB31Channel);
    });
  }
}
