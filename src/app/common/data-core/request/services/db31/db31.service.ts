import { Injectable } from '@angular/core';

import { DB31Capability } from '../../../models/db31/db31.capability';
import { HowellResponse } from '../../../models/howell-response.model';
import { DB31Url } from '../../../urls/db31/db31.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { DB31ChannelRequestService } from './db31-channel.service';
import { DB31DeviceRequestService } from './db31-device.service';

@Injectable({
  providedIn: 'root',
})
export class DB31RequestService {
  constructor(private http: HowellHttpClient) {}

  private _device?: DB31DeviceRequestService;
  public get device(): DB31DeviceRequestService {
    if (!this._device) {
      this._device = new DB31DeviceRequestService(this.http);
    }
    return this._device;
  }

  private _channel?: DB31ChannelRequestService;
  public get channel(): DB31ChannelRequestService {
    if (!this._channel) {
      this._channel = new DB31ChannelRequestService(this.http);
    }
    return this._channel;
  }
  capability() {
    let url = DB31Url.capability();
    return this.http.get<HowellResponse<DB31Capability>>(url).then((x) => {
      return HowellResponseProcess.item(x, DB31Capability);
    });
  }
}
