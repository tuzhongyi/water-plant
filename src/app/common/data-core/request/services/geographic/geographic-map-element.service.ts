import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';

import { HowellResponse } from '../../../models/howell-response.model';

import { ServiceTool } from '../../../../tools/service-tool/service.tool';
import { GeoMapElement } from '../../../models/geographic/map-element.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { GeographicUrl } from '../../../urls/geographic/geographic.url';
import { Cache } from '../../cache/cache';
import { AbstractService } from '../../cache/cache.interface';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { GetMapElementsParams } from './geographic.params';

@Injectable({
  providedIn: 'root',
})
@Cache(GeographicUrl.map.element.basic(), GeoMapElement)
export class GeographicMapElementRequestService extends AbstractService<GeoMapElement> {
  constructor(private http: HowellHttpClient) {
    super();
  }

  async create(data: GeoMapElement) {
    let url = GeographicUrl.map.element.basic();
    let _data = ObjectTool.serialize(data, GeoMapElement);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<GeoMapElement>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, GeoMapElement);
    });
  }
  async get(id: string) {
    let url = GeographicUrl.map.element.item(id);
    return this.http.get<HowellResponse<GeoMapElement>>(url).then((x) => {
      return HowellResponseProcess.item(x, GeoMapElement);
    });
  }
  async delete(id: string) {
    let url = GeographicUrl.map.element.item(id);
    return this.http.delete<HowellResponse<GeoMapElement>>(url).then((x) => {
      return HowellResponseProcess.item(x, GeoMapElement);
    });
  }
  async update(data: GeoMapElement) {
    let url = GeographicUrl.map.element.item(data.Id);
    let _data = ObjectTool.serialize(data, GeoMapElement);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<GeoMapElement>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, GeoMapElement);
    });
  }
  async list(params = new GetMapElementsParams()) {
    let url = GeographicUrl.map.element.list();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<PagedList<GeoMapElement>>, any>(url, plain).then((x) => {
      return HowellResponseProcess.paged(x, GeoMapElement);
    });
  }
  override all(params = new GetMapElementsParams()): Promise<GeoMapElement[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }
}
