export interface Config {
  playback: PlaybackConfig;
  videoUrl: string;
  user: UserConfig;
  reload: number;
  map: MapConfig;
}
interface PlaybackConfig {
  begin: number;
  end: number;
}
interface UserConfig {
  username: string;
  password: string;
}
interface MapConfig {
  find: MapFindConfig;
}

interface MapFindConfig {
  radius: number;
}
