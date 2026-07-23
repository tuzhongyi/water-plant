export interface Config {
  title: string;
  playback: PlaybackConfig;
  videoUrl: string;
  user: UserConfig;
  reload: number;
  event: EventConfig;
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
export interface MapConfig {
  find: MapFindConfig;
  model: MapModelConfig;
  marker: MapMarkerConfig;
}

interface MapFindConfig {
  radius: number;
}
interface MapModelConfig {
  label: {
    mode: string;
  };
}
interface MapMarkerConfig {
  label: {
    mode: string;
  };
}
