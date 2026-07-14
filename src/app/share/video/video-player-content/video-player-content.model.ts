import { StreamType } from '../../../common/components/video-player/video-player.model';
import { Duration } from '../../../common/tools/date-time-tool/duration.model';

export interface VideoPlayerArgs {
  cameraId: string;
  stream: StreamType;
}
export class PreviewArgs implements VideoPlayerArgs {
  stream: StreamType = StreamType.main;
  cameraId!: string;
}
export class PlaybackArgs implements VideoPlayerArgs {
  stream: StreamType = StreamType.main;
  cameraId!: string;
  duration?: Duration;
  time?: Date;
}
