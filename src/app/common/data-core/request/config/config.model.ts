export interface Config {
  title: string;
  skin: 'green' | 'blue';
  playback: PlaybackConfig;
  video: VideoConfig;

  event: EventConfig;
  alarm: AlarmConfig;
}

interface VideoConfig {
  playback: PlaybackConfig;
  reload: number;
  videoUrl: string;
  loop: number;
}

interface PlaybackConfig {
  begin: number;
  end: number;
}

interface EventConfig {
  device: number[];
  alarm: number[];
  entrance: number[];
  other: number[];
}
interface AlarmConfig {
  autoclear: boolean;
}
