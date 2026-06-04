import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';

import { HowellResponse } from '../../../models/howell-response.model';

import { Map } from '../../../models/geographic/map.model';
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
    return this.http.get<HowellResponse<Map[]>>(url).then((x) => {
      return HowellResponseProcess.array(x, Map);
    });
  }
  async create(data: Map) {
    let url = GeographicUrl.map.basic();
    let _data = ObjectTool.serialize(data, Map);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<Map>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, Map);
    });
  }
  async get(id: string) {
    let url = GeographicUrl.map.item(id);
    return this.http.get<HowellResponse<Map>>(url).then((x) => {
      return HowellResponseProcess.item(x, Map);
    });
  }
  async delete(id: string) {
    let url = GeographicUrl.map.item(id);
    return this.http.delete<HowellResponse<Map>>(url).then((x) => {
      return HowellResponseProcess.item(x, Map);
    });
  }
  async update(data: Map) {
    let url = GeographicUrl.map.item(data.Id);
    let _data = ObjectTool.serialize(data, Map);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<Map>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, Map);
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
