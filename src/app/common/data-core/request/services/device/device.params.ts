import { DurationParams, IParams, PagedParams } from '../../../models/interface/params.interface';

export class GetDevicesParams extends PagedParams {
  /**	String[]	设备ID	O	*/
  Ids?: string[];
  /**	String	名称，支持LIKE	O	*/
  Name?: string;
  /**	String	主机地址	O	*/
  Host?: string;
  /**	String	协议类型	O	*/
  ProtocolType?: string;
  /**	Int32	设备类型	O	*/
  DeviceType?: number;
  /**	String	设备序列号	O	*/
  SerialNumber?: string;
  /**	Boolean	是否开启事件接收	O	*/
  AlarmReceived?: boolean;
  /**	Boolean	自动校时	O	*/
  SyncTime?: boolean;
  /**	Int32	设备状态	O	*/
  DeviceState?: number;
}
export class GetVideoChannelsParams extends PagedParams {
  /**	String[]	通道ID	O	*/ Ids?: string[];
  /**	String	通道名称，支持LIKE	O	*/ Name?: string;
  /**	String	音频格式	O	*/ AudioFormat?: string;
  /**	String	视频格式	O	*/ VideoFormat?: string;
  /**	String	设备ID	O	*/ DeviceId?: string;
  /**	Boolean	云台控制	O	*/ PTZ?: boolean;
  /**	Boolean	是否启用	O	*/ Enabled?: boolean;
}
export class DeviceSearchingParams implements IParams {
  /**	String	协议类型	M	*/
  ProtocolType!: string;
  /**	Int32	超时时长，单位：毫秒，默认：15000	O	*/
  Timeout?: number;
}
export class GetPreviewUrlParams implements IParams {
  /**	String	监控点ID	M	*/
  CameraId!: string;
  /**	Int32	流类型：1-主码流，2-子码流	M	*/
  StreamType!: number;
  /**
   * String
   * 协议类型：rtsp, ws-ps 网页插件播放请使用ws-ps
   * M
   **/
  Protocol: string = 'ws-ps';
}
export class GetVodUrlParams extends DurationParams {
  /**	String	监控点ID	M	*/
  CameraId!: string;
  /**	Int32	流类型：1-主码流，2-子码流	M	*/
  StreamType!: number;
  /**
   * String
   * 协议类型：
   * rtsp, ws-ps
   * 网页插件播放请使用ws-ps
   * M
   **/
  Protocol: string = 'ws-ps';
}
