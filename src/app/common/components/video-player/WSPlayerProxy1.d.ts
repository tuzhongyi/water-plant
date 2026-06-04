// // declare var base64encode: (str: string) => string;
// // declare var utf16to8: (str: string) => string;
// declare class WSPlayerProxy {
//   constructor(iframe: string | HTMLIFrameElement);
//   /** 全屏状态 */
//   FullScreen: boolean;
//   download(filename: string, type: string): void;
//   resize(width: number, height: number): void;
//   fullScreen(): void;
//   stop(): Promise<void>;
//   frame(): void;
//   resume(): void;
//   speedResume(): void;
//   pause(): void;
//   capturePicture(): void;
//   slow(): void;
//   fast(): void;
//   changeRuleState(state: boolean): void;
//   seek(value: number): void;
//   subtitleEnabled(value: boolean): void;
//   setSubtitle(value: string): void;
//   getOSDTime(): void;
//   openSound(): void;
//   closeSound(): void;
//   getVolume(): void;
//   setVolume(value: number): void;

//   onStoping: (index: number) => void;
//   onPlaying: (index: number) => void;
//   /** 获取已播放未知 */
//   getPosition: (index: number, value: number) => void;
//   getTimer: (index: number, value: TimeArgs) => void;
//   onButtonClicked: (index: number, btn: string) => void;
//   /** 双击全屏 返回值：是否触发全屏 */
//   onViewerDoubleClicked: (index: number) => void;
//   onViewerClicked: (index: number) => void;
//   onRuleStateChanged: (index: number, state: boolean) => void;
//   onStatusChanged: (index: number, state: number) => void;
//   onSubtitleEnableChanged: (index: number, enabled: boolean) => void;
//   onOsdTime?: (index: number, value: number) => void;

//   destroy: () => void;
// }

// declare interface TimeArgs {
//   current: number;
//   min: number;
//   max: number;
// }
