import { Injectable } from '@angular/core';
import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';
import { ServiceTool } from '../../../../tools/service-tool/service.tool';

import { DeviceEventRecord } from '../../../models/events/device-event-record.model';
import { HowellResponse } from '../../../models/howell-response.model';
import { PagedList } from '../../../models/interface/page-list.model';
import { VideoAnalysisCapability } from '../../../models/video-analysis/video-analysis-capability.model';
import { VideoAnalysisDevice } from '../../../models/video-analysis/video-analysis-device.model';
import { VideoAnalysisTask } from '../../../models/video-analysis/video-analysis-task.model';
import { VideoAnalysisTaskCapability } from '../../../models/video-analysis/video-analysis-task-capability.model';
import { VideoAnalysisUrl } from '../../../urls/video-analysis/video-analysis.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import {
  GetVideoAnalysisDevicesParams,
  GetVideoAnalysisTasksParams,
  VideoAnalysisCapturePictureParams,
  VideoAnalysisTaskDeployParams,
} from './video-analysis.params';

@Injectable({
  providedIn: 'root',
})
export class VideoAnalysisRequestService {
  constructor(private http: HowellHttpClient) {}

  private _device?: VideoAnalysisDeviceRequestService;
  public get device(): VideoAnalysisDeviceRequestService {
    if (!this._device) {
      this._device = new VideoAnalysisDeviceRequestService(this.http);
    }
    return this._device;
  }

  private _task?: VideoAnalysisTaskRequestService;
  public get task(): VideoAnalysisTaskRequestService {
    if (!this._task) {
      this._task = new VideoAnalysisTaskRequestService(this.http);
    }
    return this._task;
  }

  capability() {
    let url = VideoAnalysisUrl.capability();
    return this.http.get<HowellResponse<VideoAnalysisCapability>>(url).then((x) => {
      return HowellResponseProcess.item(x, VideoAnalysisCapability);
    });
  }
}

class VideoAnalysisDeviceRequestService {
  constructor(private http: HowellHttpClient) {}

  async create(data: VideoAnalysisDevice) {
    let url = VideoAnalysisUrl.device.basic();
    let _data = ObjectTool.serialize(data, VideoAnalysisDevice);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<VideoAnalysisDevice>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, VideoAnalysisDevice);
    });
  }
  async get(id: string) {
    let url = VideoAnalysisUrl.device.item(id);
    return this.http.get<HowellResponse<VideoAnalysisDevice>>(url).then((x) => {
      return HowellResponseProcess.item(x, VideoAnalysisDevice);
    });
  }
  async delete(id: string) {
    let url = VideoAnalysisUrl.device.item(id);
    return this.http.delete<HowellResponse<VideoAnalysisDevice>>(url).then((x) => {
      return HowellResponseProcess.item(x, VideoAnalysisDevice);
    });
  }
  async update(data: VideoAnalysisDevice) {
    let url = VideoAnalysisUrl.device.item(data.Id);
    let _data = ObjectTool.serialize(data, VideoAnalysisDevice);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<VideoAnalysisDevice>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, VideoAnalysisDevice);
    });
  }
  async list(params = new GetVideoAnalysisDevicesParams()) {
    let url = VideoAnalysisUrl.device.list();
    let plain = instanceToPlain(params);
    return this.http
      .post<HowellResponse<PagedList<VideoAnalysisDevice>>, any>(url, plain)
      .then((x) => {
        return HowellResponseProcess.paged(x, VideoAnalysisDevice);
      });
  }
  all(params = new GetVideoAnalysisDevicesParams()): Promise<VideoAnalysisDevice[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }
}

class VideoAnalysisTaskRequestService {
  constructor(private http: HowellHttpClient) {}

  async create(data: VideoAnalysisTask) {
    let url = VideoAnalysisUrl.task.basic();
    let _data = ObjectTool.serialize(data, VideoAnalysisTask);
    let plain = instanceToPlain(_data);
    return this.http.post<HowellResponse<VideoAnalysisTask>, any>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, VideoAnalysisTask);
    });
  }
  async get(id: string) {
    let url = VideoAnalysisUrl.task.item(id);
    return this.http.get<HowellResponse<VideoAnalysisTask>>(url).then((x) => {
      return HowellResponseProcess.item(x, VideoAnalysisTask);
    });
  }
  async delete(id: string) {
    let url = VideoAnalysisUrl.task.item(id);
    return this.http.delete<HowellResponse<VideoAnalysisTask>>(url).then((x) => {
      return HowellResponseProcess.item(x, VideoAnalysisTask);
    });
  }
  async update(data: VideoAnalysisTask) {
    let url = VideoAnalysisUrl.task.item(data.Id);
    let _data = ObjectTool.serialize(data, VideoAnalysisTask);
    let plain = instanceToPlain(_data);
    return this.http.put<any, HowellResponse<VideoAnalysisTask>>(url, plain).then((x) => {
      return HowellResponseProcess.item(x, VideoAnalysisTask);
    });
  }
  async list(params = new GetVideoAnalysisTasksParams()) {
    let url = VideoAnalysisUrl.task.list();
    let plain = instanceToPlain(params);
    return this.http
      .post<HowellResponse<PagedList<VideoAnalysisTask>>, any>(url, plain)
      .then((x) => {
        return HowellResponseProcess.paged(x, VideoAnalysisTask);
      });
  }
  all(params = new GetVideoAnalysisTasksParams()): Promise<VideoAnalysisTask[]> {
    return ServiceTool.all((p) => {
      return this.list(p);
    }, params);
  }
  capability() {
    let url = VideoAnalysisUrl.task.capability();
    return this.http.get<HowellResponse<VideoAnalysisTaskCapability[]>>(url).then((x) => {
      return HowellResponseProcess.array(x, VideoAnalysisTaskCapability);
    });
  }
  events(data: FormData) {
    let url = VideoAnalysisUrl.task.events();
    return this.http.post<HowellResponse<DeviceEventRecord>, any>(url, data).then((x) => {
      return HowellResponseProcess.item(x, DeviceEventRecord);
    });
  }
  deploy(params = new VideoAnalysisTaskDeployParams()) {
    let url = VideoAnalysisUrl.task.deploy();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<VideoAnalysisTask[]>, any>(url, plain).then((x) => {
      return HowellResponseProcess.array(x, VideoAnalysisTask);
    });
  }
  start(id: string) {
    let url = VideoAnalysisUrl.task.start(id);
    return this.http.post<HowellResponse<VideoAnalysisTask>>(url).then((x) => {
      return HowellResponseProcess.item(x, VideoAnalysisTask);
    });
  }
  stop(id: string) {
    let url = VideoAnalysisUrl.task.stop(id);
    return this.http.post<HowellResponse<VideoAnalysisTask>>(url).then((x) => {
      return HowellResponseProcess.item(x, VideoAnalysisTask);
    });
  }
  capturePicture(params: VideoAnalysisCapturePictureParams) {
    let url = VideoAnalysisUrl.task.capturePicture();
    let query = new URLSearchParams();
    query.set('VideoUrl', params.VideoUrl);
    if (params.Username) {
      query.set('Username', params.Username);
    }
    if (params.Password) {
      query.set('Password', params.Password);
    }
    return this.http.blob(`${url}?${query.toString()}`, 'image/jpeg');
  }
}
