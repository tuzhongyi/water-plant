import { Transform } from 'class-transformer';
import { IIdModel } from '../interface/model.interface';
import { Transformer } from '../transformer';

/**	DB31Device (DB31设备)	*/
export class DB31Device implements IIdModel {
  /**	String	ID	M	*/
  Id!: string;
  /**	String	DB31系统ID	M	*/
  DB31Id!: string;
  /**	String	名称	O	*/
  Name?: string;
  /**	String	访问地址：http://192.168.36.109:4001/	M	*/
  HostUrl!: string;
  /**	String	MQTT地址：ws:// 192.168.36.109:1883/	O	*/
  MqttUrl?: string;
  /**	String	访问Token	O	*/
  AccessToken?: string;
  /**	Int32	设备类型	M	*/
  DeviceType!: number;
  /**	String	描述	O	*/
  Description?: string;
  /**	Int32	设备状态，0-正常，1-离线	O	*/
  DeviceState?: number;
  /**	DateTime	创建时间	O	*/
  @Transform(Transformer.datetime)
  CreationTime?: Date;
  /**	DateTime	更新时间	O	*/
  @Transform(Transformer.datetime)
  UpdateTime?: Date;
}
