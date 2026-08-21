import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';
import { ServiceTool } from '../../../../tools/service-tool/service.tool';

import { HowellResponse } from '../../../models/howell-response.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { LogCapability } from '../../../models/logs/log.capability';
import { LogRecord } from '../../../models/logs/log-record.model';
import { LogUrl } from '../../../urls/log/log.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { GetLogRecordsParams } from './log.params';

@Injectable({
  providedIn: 'root',
})
export class LogRequestService {
  constructor(private http: HowellHttpClient) {}

  async create(data: LogRecord) {
    let url = LogUrl.basic();
    let _data = ObjectTool.serialize(data, LogRecord);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<LogRecord>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, LogRecord);
    });
  }
  async get(id: string) {
    let url = LogUrl.item(id);
    return this.http.get<HowellResponse<LogRecord>>(url).then((x) => {
      return HowellResponseProcess.item(x, LogRecord);
    });
  }
  async list(params = new GetLogRecordsParams()) {
    let url = LogUrl.list();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<PagedList<LogRecord>>, any>(url, plain).then((x) => {
      return HowellResponseProcess.paged(x, LogRecord);
    });
  }
  all(params = new GetLogRecordsParams()): Promise<LogRecord[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }
  capability() {
    let url = LogUrl.capability();
    return this.http.get<HowellResponse<LogCapability>>(url).then((x) => {
      return HowellResponseProcess.item(x, LogCapability);
    });
  }
}
