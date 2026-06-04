import { Transform } from 'class-transformer';
import { IIdNameModel } from '../interface/model.interface';
import { Transformer } from '../transformer';
/**	Device (设备信息)	*/
export class Device implements IIdNameModel {
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
  /**	String	协议类型：Howell8000	M	*/
  ProtocolType!: string;
  /**
   * Int32
   * 设备类型
   * 1：IPC
   * 2：NVR
   * M
   **/
  DeviceType!: number;
  /**	String	设备序列号	O	*/
  SerialNumber?: string;
  /**	Int32	最大视频路数	O	*/
  MaxChannelCount?: number;
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
  /**	Int32	设备状态，0-正常，1-离线	O	*/
  DeviceState?: number;
  /**	DateTime	创建时间	O	*/ @Transform(Transformer.datetime)
  CreationTime?: Date;
  /**	DateTime	更新时间	O	*/ @Transform(Transformer.datetime)
  UpdateTime?: Date;
}
