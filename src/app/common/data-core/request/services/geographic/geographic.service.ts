import { Injectable } from '@angular/core';

import { GeographicCapability } from '../../../models/geographic/geographic.capability';
import { HowellResponse } from '../../../models/howell-response.model';
import { GeographicUrl } from '../../../urls/geographic/geographic.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { GeographicMapRequestService } from './geographic-map.service';

@Injectable({
  providedIn: 'root',
})
export class GeographicRequestService {
  constructor(private http: HowellHttpClient) {}

  private _map?: GeographicMapRequestService;
  public get map(): GeographicMapRequestService {
    if (!this._map) {
      this._map = new GeographicMapRequestService(this.http);
    }
    return this._map;
  }

  capability() {
    let url = GeographicUrl.capability();
    return this.http.get<HowellResponse<GeographicCapability>>(url).then((x) => {
      return HowellResponseProcess.item(x, GeographicCapability);
    });
  }
}
