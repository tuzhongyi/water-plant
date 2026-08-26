import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';
import { ServiceTool } from '../../../../tools/service-tool/service.tool';
import { DeviceStatistic } from '../../../models/devices/device-statistic.model';
import { DeviceCapability } from '../../../models/devices/device.capability';
import { Device } from '../../../models/devices/device.model';
import { VideoUrl } from '../../../models/devices/video-url.model';
import { HowellResponse } from '../../../models/howell-response.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { DeviceUrl } from '../../../urls/device/device.url';
import { Cache } from '../../cache/cache';
import { AbstractService } from '../../cache/cache.interface';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { devicePlugins } from './device.plugin';
import './device.plugins';
import {
  DeviceSearchingParams,
  DeviceVideoDownloadParams,
  GetDevicesParams,
  GetPreviewUrlParams,
  GetVodUrlParams,
} from './device.params';

@Injectable({
  providedIn: 'root',
})
@Cache(DeviceUrl.basic(), Device)
export class DeviceRequestService extends AbstractService<Device> {
  constructor(private http: HowellHttpClient) {
    super();
    // 实例化已注册的子服务插件（插件构造时自注册到本服务）
    for (const plugin of devicePlugins()) {
      this.plugin(plugin);
    }
  }

  /** 注册子服务插件：实例化插件（插件构造时会自注册到本服务） */
  plugin<T>(Plugin: new (http: HowellHttpClient, device: DeviceRequestService) => T): T {
    return new Plugin(this.http, this);
  }

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
  override all(params = new GetDevicesParams()): Promise<Device[]> {
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

  statistics() {
    let url = DeviceUrl.statistics();
    return this.http.get<HowellResponse<DeviceStatistic>>(url).then((x) => {
      return HowellResponseProcess.item(x, DeviceStatistic);
    });
  }

  download(
    params: DeviceVideoDownloadParams,
    onProgress?: (loaded: number, total: number) => void,
  ) {
    let url = DeviceUrl.download(params.VideoChannelId, params.TimeRange, params.FileName);
    return this.http.download(url, 'video/mp4', {
      process: (progress) => onProgress?.(progress.loaded, progress.total),
    });
  }
}
