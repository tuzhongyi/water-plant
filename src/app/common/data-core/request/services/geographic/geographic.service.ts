import { Injectable } from '@angular/core';

import { HowellHttpClient } from '../howell-http.client';
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
}
