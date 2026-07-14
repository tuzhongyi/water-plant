import { Injectable } from '@angular/core';

import { EventCapability } from '../../../models/events/event.capability';
import { HowellResponse } from '../../../models/howell-response.model';
import { EventUrl } from '../../../urls/event/event.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { EventBehaviorRequestService } from './event-behavior.service';
import { EventRecordRequestService } from './event-record.service';

@Injectable({
  providedIn: 'root',
})
export class EventRequestService {
  constructor(private http: HowellHttpClient) {}

  private _record?: EventRecordRequestService;
  public get record(): EventRecordRequestService {
    if (!this._record) {
      this._record = new EventRecordRequestService(this.http);
    }
    return this._record;
  }

  private _behavior?: EventBehaviorRequestService;
  public get behavior(): EventBehaviorRequestService {
    if (!this._behavior) {
      this._behavior = new EventBehaviorRequestService(this.http);
    }
    return this._behavior;
  }

  capability() {
    let url = EventUrl.capability();
    return this.http.get<HowellResponse<EventCapability>>(url).then((x) => {
      return HowellResponseProcess.item(x, EventCapability);
    });
  }
}
