import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';
import { ServiceTool } from '../../../../tools/service-tool/service.tool';

import { HowellResponse } from '../../../models/howell-response.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { RegionResource } from '../../../models/regions/region-resource.model';
import { RegionTreeNode } from '../../../models/regions/region-tree-node.model';
import { RegionCapability } from '../../../models/regions/region.capability';
import { Region } from '../../../models/regions/region.model';
import { RegionUrl } from '../../../urls/region/region.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { GetRegionResourcesParams, GetRegionsParams } from './region.params';

@Injectable({
  providedIn: 'root',
})
export class RegionRequestService {
  constructor(private http: HowellHttpClient) {}

  capability() {
    let url = RegionUrl.capability();
    return this.http.get<HowellResponse<RegionCapability>>(url).then((x) => {
      return HowellResponseProcess.item(x, RegionCapability);
    });
  }

  async create(data: Region) {
    let url = RegionUrl.basic();
    let _data = ObjectTool.serialize(data, Region);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<Region>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, Region);
    });
  }
  async get(id: string) {
    let url = RegionUrl.item(id);
    return this.http.get<HowellResponse<Region>>(url).then((x) => {
      return HowellResponseProcess.item(x, Region);
    });
  }
  async delete(id: string) {
    let url = RegionUrl.item(id);
    return this.http.delete<HowellResponse<Region>>(url).then((x) => {
      return HowellResponseProcess.item(x, Region);
    });
  }
  async update(data: Region) {
    let url = RegionUrl.item(data.Id);
    let _data = ObjectTool.serialize(data, Region);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<Region>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, Region);
    });
  }
  async list(params = new GetRegionsParams()) {
    let url = RegionUrl.list();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<PagedList<Region>>, any>(url, plain).then((x) => {
      return HowellResponseProcess.paged(x, Region);
    });
  }
  all(params = new GetRegionsParams()): Promise<Region[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }
  tree = {
    nodes: () => {
      let url = RegionUrl.treeNodes();
      return this.http.get<HowellResponse<RegionTreeNode[]>>(url).then((x) => {
        return HowellResponseProcess.array(x, RegionTreeNode);
      });
    },
  };

  private _resource?: RegionResourceRequestService;
  public get resource(): RegionResourceRequestService {
    if (!this._resource) {
      this._resource = new RegionResourceRequestService(this.http);
    }
    return this._resource;
  }
}

class RegionResourceRequestService {
  constructor(private http: HowellHttpClient) {}

  async create(data: RegionResource) {
    let url = RegionUrl.resource.basic();
    let _data = ObjectTool.serialize(data, RegionResource);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<RegionResource>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, RegionResource);
    });
  }
  async get(regionId: string, resourceId: string) {
    let url = RegionUrl.resource.item(regionId, resourceId);
    return this.http.get<HowellResponse<RegionResource>>(url).then((x) => {
      return HowellResponseProcess.item(x, RegionResource);
    });
  }
  async delete(regionId: string, resourceId: string) {
    let url = RegionUrl.resource.item(regionId, resourceId);
    return this.http.delete<HowellResponse<RegionResource>>(url).then((x) => {
      return HowellResponseProcess.item(x, RegionResource);
    });
  }
  async update(data: RegionResource) {
    let url = RegionUrl.resource.item(data.RegionId, data.ResourceId);
    let _data = ObjectTool.serialize(data, RegionResource);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<RegionResource>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, RegionResource);
    });
  }
  async list(params = new GetRegionResourcesParams()) {
    let url = RegionUrl.resource.list();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<PagedList<RegionResource>>, any>(url, plain).then((x) => {
      return HowellResponseProcess.paged(x, RegionResource);
    });
  }
  all(params = new GetRegionResourcesParams()): Promise<RegionResource[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }
}
