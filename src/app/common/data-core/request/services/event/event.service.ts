import { Injectable } from '@angular/core';

import { EventCapability } from '../../../models/capabilities/event.capability';
import { HowellResponse } from '../../../models/howell-response.model';
import { EventUrl } from '../../../urls/event/event.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
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

  capability() {
    let url = EventUrl.capability();
    return this.http.get<HowellResponse<EventCapability>>(url).then((x) => {
      return HowellResponseProcess.item(x, EventCapability);
    });
  }
}
