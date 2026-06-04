import { IIdNameModel } from '../interface/model.interface';

/**	VideoChannel (视频通道)	*/
export class VideoChannel implements IIdNameModel {
  /**	String	通道ID	M	*/
  Id!: string;
  /**	String	通道名称	M	*/
  Name!: string;
  /**	String	设备ID	M	*/
  DeviceId!: string;
  /**	Int32	通道编号，从1开始	M	*/
  ChannelNo!: number;
  /**	String	音频格式，G.711A	O	*/
  AudioFormat?: string;
  /**	String	视频格式，H.264，H265	M	*/
  VideoFormat!: string;
  /**	Boolean	是否启用，True：启用	M	*/
  Enabled!: boolean;
  /**	Boolean	云台控制，True：启用	M	*/
  PTZ!: boolean;
  /**	String	描述信息	O	*/
  Description?: string;
  /**	Int32	通道状态，0-正常，1-离线	O	*/
  ChannelState?: number;
}
