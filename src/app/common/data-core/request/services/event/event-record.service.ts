import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';

import { HowellResponse } from '../../../models/howell-response.model';

import { ServiceTool } from '../../../../tools/service-tool/service.tool';
import { DeviceEventRecord } from '../../../models/events/device-event-record.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { EventUrl } from '../../../urls/event/event.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { GetDeviceEventRecordsParams } from './event.params';

@Injectable({
  providedIn: 'root',
})
export class EventRecordRequestService {
  constructor(private http: HowellHttpClient) {}
  async array() {
    let url = EventUrl.record.basic();
    return this.http.get<HowellResponse<DeviceEventRecord[]>>(url).then((x) => {
      return HowellResponseProcess.array(x, DeviceEventRecord);
    });
  }
  async create(data: DeviceEventRecord) {
    let url = EventUrl.record.basic();
    let _data = ObjectTool.serialize(data, DeviceEventRecord);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<DeviceEventRecord>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, DeviceEventRecord);
    });
  }
  async get(id: string) {
    let url = EventUrl.record.item(id);
    return this.http.get<HowellResponse<DeviceEventRecord>>(url).then((x) => {
      return HowellResponseProcess.item(x, DeviceEventRecord);
    });
  }
  async delete(id: string) {
    let url = EventUrl.record.item(id);
    return this.http.delete<HowellResponse<DeviceEventRecord>>(url).then((x) => {
      return HowellResponseProcess.item(x, DeviceEventRecord);
    });
  }
  async update(data: DeviceEventRecord) {
    let url = EventUrl.record.item(data.Id);
    let _data = ObjectTool.serialize(data, DeviceEventRecord);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<DeviceEventRecord>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, DeviceEventRecord);
    });
  }
  async list(params = new GetDeviceEventRecordsParams()) {
    let url = EventUrl.record.list();
    let plain = instanceToPlain(params);
    return this.http
      .post<HowellResponse<PagedList<DeviceEventRecord>>, any>(url, plain)
      .then((x) => {
        return HowellResponseProcess.paged(x, DeviceEventRecord);
      });
  }
  all(params = new GetDeviceEventRecordsParams()): Promise<DeviceEventRecord[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }
}
