import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';

import { HowellResponse } from '../../../models/howell-response.model';

import { ServiceTool } from '../../../../tools/service-tool/service.tool';
import { MapElement } from '../../../models/geographic/map-element.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { GeographicUrl } from '../../../urls/geographic/geographic.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { GetMapElementsParams } from './geographic.params';

@Injectable({
  providedIn: 'root',
})
export class GeographicMapElementRequestService {
  constructor(private http: HowellHttpClient) {}

  async create(data: MapElement) {
    let url = GeographicUrl.map.element.basic();
    let _data = ObjectTool.serialize(data, MapElement);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<MapElement>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, MapElement);
    });
  }
  async get(id: string) {
    let url = GeographicUrl.map.element.item(id);
    return this.http.get<HowellResponse<MapElement>>(url).then((x) => {
      return HowellResponseProcess.item(x, MapElement);
    });
  }
  async delete(id: string) {
    let url = GeographicUrl.map.element.item(id);
    return this.http.delete<HowellResponse<MapElement>>(url).then((x) => {
      return HowellResponseProcess.item(x, MapElement);
    });
  }
  async update(data: MapElement) {
    let url = GeographicUrl.map.element.item(data.Id);
    let _data = ObjectTool.serialize(data, MapElement);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<MapElement>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, MapElement);
    });
  }
  async list(params = new GetMapElementsParams()) {
    let url = GeographicUrl.map.element.list();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<PagedList<MapElement>>, any>(url, plain).then((x) => {
      return HowellResponseProcess.paged(x, MapElement);
    });
  }
  all(params = new GetMapElementsParams()): Promise<MapElement[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }
}
