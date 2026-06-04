import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';

import { HowellResponse } from '../../../models/howell-response.model';

import { ServiceTool } from '../../../../tools/service-tool/service.tool';
import { DB31Device } from '../../../models/db31/db31-device.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { DB31Url } from '../../../urls/db31/db31.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { GetDB31DevicesParams } from './db31.params';

@Injectable({
  providedIn: 'root',
})
export class DB31DeviceRequestService {
  constructor(private http: HowellHttpClient) {}
  async array() {
    let url = DB31Url.device.basic();
    return this.http.get<HowellResponse<DB31Device[]>>(url).then((x) => {
      return HowellResponseProcess.array(x, DB31Device);
    });
  }
  async create(data: DB31Device) {
    let url = DB31Url.device.basic();
    let _data = ObjectTool.serialize(data, DB31Device);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<DB31Device>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, DB31Device);
    });
  }
  async get(id: string) {
    let url = DB31Url.device.item(id);
    return this.http.get<HowellResponse<DB31Device>>(url).then((x) => {
      return HowellResponseProcess.item(x, DB31Device);
    });
  }
  async delete(id: string) {
    let url = DB31Url.device.item(id);
    return this.http.delete<HowellResponse<DB31Device>>(url).then((x) => {
      return HowellResponseProcess.item(x, DB31Device);
    });
  }
  async update(data: DB31Device) {
    let url = DB31Url.device.item(data.Id);
    let _data = ObjectTool.serialize(data, DB31Device);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<DB31Device>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, DB31Device);
    });
  }
  async list(params = new GetDB31DevicesParams()) {
    let url = DB31Url.device.list();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<PagedList<DB31Device>>, any>(url, plain).then((x) => {
      return HowellResponseProcess.paged(x, DB31Device);
    });
  }
  all(params = new GetDB31DevicesParams()): Promise<DB31Device[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }
}
