export interface Config {
  title: string;
  skin: 'green' | 'blue';
  playback: PlaybackConfig;
  videoUrl: string;
  user: UserConfig;
  reload: number;
  event: EventConfig;
  alarm: AlarmConfig;
}
interface PlaybackConfig {
  begin: number;
  end: number;
}
interface UserConfig {
  username: string;
  password: string;
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
