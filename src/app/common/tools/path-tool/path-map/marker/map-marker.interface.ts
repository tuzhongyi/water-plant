export interface IMapMarkerPath {
  get normal(): string;
  get hover(): string;
  get selected(): string;
}
export interface IMapMarkerOffline {
  get offline(): string;
}
export interface IMapMarkerStay {
  get stay(): IMapMarkerPath;
}
export interface IMapMarkerFull {
  get full(): IMapMarkerPath;
}
