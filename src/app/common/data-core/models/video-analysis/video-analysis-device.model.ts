import { Transform, Type } from 'class-transformer';
import { IIdNameModel } from '../interface/model.interface';
import { Transformer } from '../transformer';
import { VideoAnalysisDeviceStatus } from './video-analysis-device-status.model';

/**	VideoAnalysisDevice (视频分析设备)	*/
export class VideoAnalysisDevice implements IIdNameModel {
  /**	String	设备ID	M	*/
  Id!: string;
  /**	String	服务器名称	M	*/
  Name!: string;
  /**	String	主机地址，192.168.22.1	M	*/
  Host!: string;
  /**	Int32	端口号，7000	M	*/
  Port!: number;
  /**	Int32	网页端口号，80	M	*/
  WebPort!: number;
  /**	String	协议类型：Howell	M	*/
  ProtocolType!: string;
  /**	Int32	设备类型	M	*/
  DeviceType!: number;
  /**	String	设备序列号	O	*/
  SerialNumber?: string;
  /**	Boolean	是否开启事件接收	M	*/
  AlarmReceived!: boolean;
  /**	String	用户名	O	*/
  Username?: string;
  /**	String	密码	O	*/
  Password?: string;
  /**	String	描述信息	O	*/
  Description?: string;
  /**	Boolean	自动校时	M	*/
  SyncTime!: boolean;
  /**	Int32	设备在线状态，0-正常，1-离线	O	*/
  DeviceState?: number;
  /**	DateTime	创建时间	O	*/
  @Transform(Transformer.datetime)
  CreationTime?: Date;
  /**	DateTime	更新时间	O	*/
  @Transform(Transformer.datetime)
  UpdateTime?: Date;
  /**	VideoAnalysisDeviceStatus	设备运行状态	O	*/
  @Type(() => VideoAnalysisDeviceStatus)
  DeviceStatus?: VideoAnalysisDeviceStatus;
}
