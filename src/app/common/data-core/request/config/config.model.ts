export interface Config {
  playback: PlaybackConfig;
  videoUrl: string;
  user: UserConfig;
  reload: number;
}
interface PlaybackConfig {
  begin: number;
  end: number;
}
interface UserConfig {
  username: string;
  password: string;
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
