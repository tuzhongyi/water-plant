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
