import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';

import { HowellResponse } from '../../../models/howell-response.model';

import { GeoMap } from '../../../models/geographic/map.model';
import { GeographicUrl } from '../../../urls/geographic/geographic.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { GeographicMapElementRequestService } from './geographic-map-element.service';

@Injectable({
  providedIn: 'root',
})
export class GeographicMapRequestService {
  constructor(private http: HowellHttpClient) {}
  async array() {
    let url = GeographicUrl.map.basic();
    return this.http.get<HowellResponse<GeoMap[]>>(url).then((x) => {
      return HowellResponseProcess.array(x, GeoMap);
    });
  }
  async create(data: GeoMap) {
    let url = GeographicUrl.map.basic();
    let _data = ObjectTool.serialize(data, GeoMap);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<GeoMap>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, GeoMap);
    });
  }
  async get(id: string) {
    let url = GeographicUrl.map.item(id);
    return this.http.get<HowellResponse<GeoMap>>(url).then((x) => {
      return HowellResponseProcess.item(x, GeoMap);
    });
  }
  async delete(id: string) {
    let url = GeographicUrl.map.item(id);
    return this.http.delete<HowellResponse<GeoMap>>(url).then((x) => {
      return HowellResponseProcess.item(x, GeoMap);
    });
  }
  async update(data: GeoMap) {
    let url = GeographicUrl.map.item(data.Id);
    let _data = ObjectTool.serialize(data, GeoMap);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<GeoMap>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, GeoMap);
    });
  }

  private _element?: GeographicMapElementRequestService;
  public get element(): GeographicMapElementRequestService {
    if (!this._element) {
      this._element = new GeographicMapElementRequestService(this.http);
    }
    return this._element;
  }
}
