import {
  PlayMode,
  StreamType,
  VideoModel,
} from '../../../components/video-player/video-player.model';
import { VideoChannel } from '../../../data-core/models/devices/video-channel.model';
import { Duration } from '../../date-time-tool/duration.model';

export class ObjectModelVideoTool {
  from = {
    channel: (data: VideoChannel, mode: PlayMode, stream: StreamType, duration?: Duration) => {
      let model = new VideoModel();
      model.mode = mode;
      model.deviceId = data.DeviceId;
      model.beginTime = duration?.begin;
      model.endTime = duration?.end;
      model.host = location.hostname;
      model.port = location.port ? parseInt(location.port) : 80;
      if (location.port == '9001') {
        model.host = '192.168.21.122';
        model.port = 10001;
      }

      model.username = 'howell';
      model.password = '123456';
      model.sourceId = data.Id;
      model.slot = data.ChannelNo;
      model.stream = stream;
      return model;
    },
  };
}
