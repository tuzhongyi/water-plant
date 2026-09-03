import { StreamType } from '../../../common/components/video-player/video-player.model';
import { Duration } from '../../../common/tools/date-time-tool/duration.model';

export interface IVideoPlayerArgs {
  cameraId: string;
  cameraName?: string;
  stream: StreamType;
  index?: number;
}
export class PreviewArgs implements IVideoPlayerArgs {
  stream: StreamType = StreamType.main;
  cameraId!: string;
  cameraName = '';
  index?: number;
}
export class PlaybackArgs implements IVideoPlayerArgs {
  stream: StreamType = StreamType.main;
  cameraId!: string;
  cameraName = '';
  duration?: Duration;
  time?: Date;
  index?: number;
}
