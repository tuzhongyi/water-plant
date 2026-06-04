declare class WSPlayerProxy {
  status: number;
  event: EventEmitter<IWSPlayerProxyEvent>;

  constructor(iframeId: string | HTMLIFrameElement);

  postMessage(data: any): void;

  stop(): void;
  play(): void;
  seek(value: number): void;
  fast(): void;
  slow(): void;
  capturePicture(): void;
  pause(): void;
  speedResume(): void;
  resume(): void;
  frame(): void;
  fullScreen(): void;
  resize(width: number, height: number): void;
  fullExit(): void;
  download(filename: string, type: string): void;
  openSound(): void;
  closeSound(): void;
  getVolume(): void;
  setVolume(value: number): void;
  subtitleEnabled(value: boolean): void;
  setSubtitle(value: string): void;
  getOSDTime(): void;

  destroy(): void;
  destory(): void;

  changeRuleState(value: boolean): void;

  onStoping?: (index: number) => void;
  getPosition?: (index: number, value: number) => void;
  onPlaying?: (index: number) => void;
  onButtonClicked?: (index: number, value: string) => void;
  onViewerDoubleClicked?: (index: number) => void;
  onViewerClicked?: (index: number) => void;
  onRuleStateChanged?: (index: number, value: boolean) => void;
  onStatusChanged?: (index: number, value: number) => void;
  getTimer?: (
    index: number,
    value: {
      current: number;
      min: number;
      max: number;
    }
  ) => void;
  onSubtitleEnableChanged?: (index: number, enabled: boolean) => void;
  onOsdTime?: (index: number, value: number) => void;
}

declare interface IWSPlayerProxyEvent {
  onStoping?: (index: number) => void;
  getPosition?: (index: number, value: number) => void;
  onPlaying?: (index: number) => void;
  onButtonClicked?: (index: number, value: string) => void;
  onViewerDoubleClicked?: (index: number) => void;
  onViewerClicked?: (index: number) => void;
  onRuleStateChanged?: (index: number, value: boolean) => void;
  onStatusChanged?: (index: number, value: number) => void;
  getTimer?: (
    index: number,
    value: {
      current: number;
      min: number;
      max: number;
    }
  ) => void;
  onSubtitleEnableChanged?: (index: number, enabled: boolean) => void;
  onOsdTime?: (index: number, value: number) => void;
}
declare class EventEmitter<T> {
  on<K extends keyof T>(event: K, listener: T[K]): void;
  off<K extends keyof T>(event: K, listener: T[K]): void;
  emit<K extends keyof T>(event: K, ...args: any): void;
}
