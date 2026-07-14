import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';

import { HowellResponse } from '../../../models/howell-response.model';

import { ServiceTool } from '../../../../tools/service-tool/service.tool';
import { EventBehavior } from '../../../models/events/event-behavior.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { EventUrl } from '../../../urls/event/event.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { GetEventBehaviorsParams } from './event.params';

@Injectable({
  providedIn: 'root',
})
export class EventBehaviorRequestService {
  constructor(private http: HowellHttpClient) {}
  async array() {
    let url = EventUrl.behavior.basic();
    return this.http.get<HowellResponse<EventBehavior[]>>(url).then((x) => {
      return HowellResponseProcess.array(x, EventBehavior);
    });
  }
  async create(data: EventBehavior) {
    let url = EventUrl.behavior.basic();
    let _data = ObjectTool.serialize(data, EventBehavior);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<EventBehavior>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, EventBehavior);
    });
  }
  async get(id: string) {
    let url = EventUrl.behavior.item(id);
    return this.http.get<HowellResponse<EventBehavior>>(url).then((x) => {
      return HowellResponseProcess.item(x, EventBehavior);
    });
  }
  async delete(id: string) {
    let url = EventUrl.behavior.item(id);
    return this.http.delete<HowellResponse<EventBehavior>>(url).then((x) => {
      return HowellResponseProcess.item(x, EventBehavior);
    });
  }
  async update(data: EventBehavior) {
    let url = EventUrl.behavior.item(data.Id);
    let _data = ObjectTool.serialize(data, EventBehavior);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<EventBehavior>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, EventBehavior);
    });
  }
  async list(params = new GetEventBehaviorsParams()) {
    let url = EventUrl.behavior.list();
    let plain = instanceToPlain(params);
    return this.http
      .post<HowellResponse<PagedList<EventBehavior>>, any>(url, plain)
      .then((x) => {
        return HowellResponseProcess.paged(x, EventBehavior);
      });
  }
  all(params = new GetEventBehaviorsParams()): Promise<EventBehavior[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }
}
