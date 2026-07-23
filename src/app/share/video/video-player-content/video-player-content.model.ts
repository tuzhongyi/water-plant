import { StreamType } from '../../../common/components/video-player/video-player.model';
import { Duration } from '../../../common/tools/date-time-tool/duration.model';

export interface IVideoPlayerArgs {
  cameraId: string;
  stream: StreamType;
}
export class PreviewArgs implements IVideoPlayerArgs {
  stream: StreamType = StreamType.main;
  cameraId!: string;
}
export class PlaybackArgs implements IVideoPlayerArgs {
  stream: StreamType = StreamType.main;
  cameraId!: string;
  duration?: Duration;
  time?: Date;
}
