import { Injectable } from '@angular/core';

import { HowellHttpClient } from '../howell-http.client';
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
}
