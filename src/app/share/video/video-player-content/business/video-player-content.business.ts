import { Injectable } from '@angular/core';

import { VideoModel } from '../../../../common/components/video-player/video-player.model';
import { VideoUrl } from '../../../../common/data-core/models/devices/video-url.model';
import { ConfigRequestService } from '../../../../common/data-core/request/config/config-request.service';
import {
  GetPreviewUrlParams,
  GetVodUrlParams,
} from '../../../../common/data-core/request/services/device/device.params';
import { DeviceRequestService } from '../../../../common/data-core/request/services/device/device.service';
import { PlaybackArgs, PreviewArgs } from '../video-player-content.model';

@Injectable()
export class VideoPlayerContentBusiness {
  constructor(
    private service: DeviceRequestService,
    private config: ConfigRequestService,
  ) {}

  async preview(args: PreviewArgs) {
    let params = new GetPreviewUrlParams();
    params.CameraId = args.cameraId;
    params.StreamType = args.stream;
    let url = await this.service.url.preview(params);
    let model = this.convert(url);
    model.sourceId = args.cameraId;
    return model;
  }

  async playback(args: PlaybackArgs, reserve?: number) {
    let params = new GetVodUrlParams();
    if (args.duration) {
      params.BeginTime = args.duration.begin;
      params.EndTime = args.duration.end;
    } else if (args.time) {
      let config = await this.config.get();

      let now = new Date();
      let begin = new Date(now.getTime());
      begin.setSeconds(begin.getSeconds() + config.playback.begin);

      let end = new Date(now.getTime());
      end.setSeconds(begin.getSeconds() + config.playback.end);

      params.BeginTime = begin;
      params.EndTime = end;
    } else {
      throw new Error('args.duration or args.time is required');
    }

    if (reserve) {
      params.BeginTime = new Date(params.BeginTime.getTime() - reserve);
    }

    params.CameraId = args.cameraId;
    params.StreamType = args.stream;
    let url = await this.service.url.vod(params);
    let model = this.convert(url);
    model.sourceId = args.cameraId;
    return model;
  }

  private convert(url: VideoUrl) {
    let model = VideoModel.fromUrl(url.Url);
    if (url.Username) {
      model.username = url.Username;
    }
    if (url.Password) {
      model.password = url.Password;
    }
    return model;
  }
}
