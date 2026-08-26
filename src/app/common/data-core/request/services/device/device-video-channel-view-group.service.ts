import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';
import { ServiceTool } from '../../../../tools/service-tool/service.tool';

import { VideoChannelViewGroup } from '../../../models/devices/video-channel-view-group.model';
import { HowellResponse } from '../../../models/howell-response.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { DeviceUrl } from '../../../urls/device/device.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { GetVideoChannelViewGroupsParams } from './device.params';
import type { DeviceRequestService } from './device.service';
import { registerDevicePlugin } from './device.plugin';

declare module './device.service' {
  interface DeviceRequestService {
    viewGroup: DeviceVideoChannelViewGroupRequestService;
  }
}

export class DeviceVideoChannelViewGroupRequestService {
  constructor(
    private http: HowellHttpClient,
    device: DeviceRequestService,
  ) {
    device.viewGroup = this;
  }

  async create(data: VideoChannelViewGroup) {
    let url = DeviceUrl.viewGroup.basic();
    let _data = ObjectTool.serialize(data, VideoChannelViewGroup);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<VideoChannelViewGroup>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, VideoChannelViewGroup);
    });
  }
  async get(id: string) {
    let url = DeviceUrl.viewGroup.item(id);
    return this.http.get<HowellResponse<VideoChannelViewGroup>>(url).then((x) => {
      return HowellResponseProcess.item(x, VideoChannelViewGroup);
    });
  }
  async delete(id: string) {
    let url = DeviceUrl.viewGroup.item(id);
    return this.http.delete<HowellResponse<VideoChannelViewGroup>>(url).then((x) => {
      return HowellResponseProcess.item(x, VideoChannelViewGroup);
    });
  }
  async update(data: VideoChannelViewGroup) {
    let url = DeviceUrl.viewGroup.item(data.Id);
    let _data = ObjectTool.serialize(data, VideoChannelViewGroup);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<VideoChannelViewGroup>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, VideoChannelViewGroup);
    });
  }
  async list(params = new GetVideoChannelViewGroupsParams()) {
    let url = DeviceUrl.viewGroup.list();
    let plain = instanceToPlain(params);
    return this.http
      .post<HowellResponse<PagedList<VideoChannelViewGroup>>, any>(url, plain)
      .then((x) => {
        return HowellResponseProcess.paged(x, VideoChannelViewGroup);
      });
  }
  all(params = new GetVideoChannelViewGroupsParams()): Promise<VideoChannelViewGroup[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }
}

registerDevicePlugin(DeviceVideoChannelViewGroupRequestService);
