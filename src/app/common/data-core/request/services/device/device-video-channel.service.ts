import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';
import { ServiceTool } from '../../../../tools/service-tool/service.tool';

import { VideoChannel } from '../../../models/devices/video-channel.model';
import { HowellResponse } from '../../../models/howell-response.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { DeviceUrl } from '../../../urls/device/device.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { GetVideoChannelsParams } from './device.params';

export class DeviceVideoRequestService {
  constructor(private http: HowellHttpClient) {}

  private _channel?: DeviceVideoChannelRequestService;
  public get channel(): DeviceVideoChannelRequestService {
    if (!this._channel) {
      this._channel = new DeviceVideoChannelRequestService(this.http);
    }
    return this._channel;
  }
}

class DeviceVideoChannelRequestService {
  constructor(private http: HowellHttpClient) {}

  async create(data: VideoChannel) {
    let url = DeviceUrl.video.channel(data.DeviceId).basic();
    let _data = ObjectTool.serialize(data, VideoChannel);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<VideoChannel>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, VideoChannel);
    });
  }
  async get(deviceId: string, channelId: string) {
    let url = DeviceUrl.video.channel(deviceId).item(channelId);
    return this.http.get<HowellResponse<VideoChannel>>(url).then((x) => {
      return HowellResponseProcess.item(x, VideoChannel);
    });
  }
  async delete(deviceId: string, channelId: string) {
    let url = DeviceUrl.video.channel(deviceId).item(channelId);
    return this.http.delete<HowellResponse<VideoChannel>>(url).then((x) => {
      return HowellResponseProcess.item(x, VideoChannel);
    });
  }
  async update(data: VideoChannel) {
    let url = DeviceUrl.video.channel(data.DeviceId).item(data.Id);
    let _data = ObjectTool.serialize(data, VideoChannel);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<VideoChannel>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, VideoChannel);
    });
  }
  async list(params = new GetVideoChannelsParams()) {
    let url = DeviceUrl.video.channel().list();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<PagedList<VideoChannel>>, any>(url, plain).then((x) => {
      return HowellResponseProcess.paged(x, VideoChannel);
    });
  }
  all(params = new GetVideoChannelsParams()): Promise<VideoChannel[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }

  picture(channelId: string) {
    let url = DeviceUrl.video.channel().picture(channelId);
    return url;
  }

  ptz(channelId: string) {
    let url = DeviceUrl.video.channel().ptz(channelId);
    return this.http.post<void>(url);
  }
}
