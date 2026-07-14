import { Injectable } from '@angular/core';
import {
  PlayMode,
  StreamType,
  VideoModel,
} from '../../../common/components/video-player/video-player.model';
import { VideoUrl } from '../../../common/data-core/models/devices/video-url.model';
import {
  GetPreviewUrlParams,
  GetVodUrlParams,
} from '../../../common/data-core/request/services/device/device.params';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';
import { Duration } from '../../../common/tools/date-time-tool/duration.model';

@Injectable()
export class VideoPlayerContainerBusiness {
  constructor(private service: DeviceRequestService) {}

  async load(cameraId: string, mode: PlayMode, duration?: Duration): Promise<VideoModel> {
    let data = await this.data.load(cameraId, mode, duration);
    let model = this.convert(data);
    model.sourceId = cameraId;
    return model;
  }

  private convert(data: VideoUrl) {
    let model = new VideoModel(data.Url);
    if (location.hostname == '127.0.0.1' && location.port == '9001') {
      if (model.host == 'localhost' || model.host == '127.0.0.1') {
        model.host = '192.168.21.122';
      }
    }
    if (data.Username) {
      model.username = data.Username;
    }
    if (data.Password) {
      model.password = data.Password;
    }
    return model;
  }

  private data = {
    load: (cameraId: string, mode: PlayMode, duration?: Duration) => {
      if (mode == PlayMode.vod && !!duration) {
        return this.data.playback(cameraId, duration);
      } else {
        return this.data.preview(cameraId);
      }
    },
    preview: (cameraId: string) => {
      let params = new GetPreviewUrlParams();
      params.CameraId = cameraId;
      params.StreamType = StreamType.main;
      return this.service.url.preview(params);
    },
    playback: (cameraId: string, duration: Duration) => {
      let params = new GetVodUrlParams();
      params.CameraId = cameraId;
      params.StreamType = StreamType.main;
      params.BeginTime = duration.begin;
      params.EndTime = duration.end;
      return this.service.url.vod(params);
    },
  };
}
