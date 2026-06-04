import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';
import { ServiceTool } from '../../../../tools/service-tool/service.tool';
import { DeviceCapability } from '../../../models/capabilities/device.capability';
import { Device } from '../../../models/devices/device.model';
import { VideoUrl } from '../../../models/devices/video-url.model';
import { HowellResponse } from '../../../models/howell-response.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { DeviceUrl } from '../../../urls/device/device.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { DeviceFaceRequestService } from './device-face-snap.service';
import { DeviceVideoRequestService } from './device-video-channel.service';
import {
  DeviceSearchingParams,
  GetDevicesParams,
  GetPreviewUrlParams,
  GetVodUrlParams,
} from './device.params';

@Injectable({
  providedIn: 'root',
})
export class DeviceRequestService {
  constructor(private http: HowellHttpClient) {}

  async create(data: Device, channel: boolean) {
    let url = DeviceUrl.create(channel);
    let _data = ObjectTool.serialize(data, Device);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<Device>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, Device);
    });
  }
  async get(id: string) {
    let url = DeviceUrl.item(id);
    return this.http.get<HowellResponse<Device>>(url).then((x) => {
      return HowellResponseProcess.item(x, Device);
    });
  }
  async delete(id: string) {
    let url = DeviceUrl.item(id);
    return this.http.delete<HowellResponse<Device>>(url).then((x) => {
      return HowellResponseProcess.item(x, Device);
    });
  }
  async update(data: Device) {
    let url = DeviceUrl.item(data.Id);
    let _data = ObjectTool.serialize(data, Device);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<Device>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, Device);
    });
  }
  async list(params = new GetDevicesParams()) {
    let url = DeviceUrl.list();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<PagedList<Device>>, any>(url, plain).then((x) => {
      return HowellResponseProcess.paged(x, Device);
    });
  }
  all(params = new GetDevicesParams()): Promise<Device[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }

  searching(params: DeviceSearchingParams) {
    let url = DeviceUrl.searching();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<Device[]>, any>(url, plain).then((x) => {
      return HowellResponseProcess.array(x, Device);
    });
  }

  url = {
    preview: (params: GetPreviewUrlParams) => {
      let url = DeviceUrl.url.preview();
      let plain = instanceToPlain(params);
      return this.http.post<HowellResponse<VideoUrl>, any>(url, plain).then((x) => {
        return HowellResponseProcess.item(x, VideoUrl);
      });
    },
    vod: (params: GetVodUrlParams) => {
      let url = DeviceUrl.url.vod();
      let plain = instanceToPlain(params);
      return this.http.post<HowellResponse<VideoUrl>, any>(url, plain).then((x) => {
        return HowellResponseProcess.item(x, VideoUrl);
      });
    },
  };

  capability() {
    let url = DeviceUrl.capability();
    return this.http.get<HowellResponse<DeviceCapability>>(url).then((x) => {
      return HowellResponseProcess.item(x, DeviceCapability);
    });
  }

  private _video?: DeviceVideoRequestService;
  public get video(): DeviceVideoRequestService {
    if (!this._video) {
      this._video = new DeviceVideoRequestService(this.http);
    }
    return this._video;
  }

  private _face?: DeviceFaceRequestService;
  public get face(): DeviceFaceRequestService {
    if (!this._face) {
      this._face = new DeviceFaceRequestService(this.http);
    }
    return this._face;
  }
}
