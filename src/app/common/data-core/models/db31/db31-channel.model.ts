import { IIdModel } from '../interface/model.interface';

/**	DB31Channel (DB31设备通道)	*/
export class DB31Channel implements IIdModel {
  /**	String	ID	M	*/
  Id!: string;
  /**	String	DB31系统ID	O	*/
  DB31Id?: string;
  /**	String	设备ID	M	*/
  DeviceId!: string;
  /**	String	名称	O	*/
  Name?: string;
  /**	String	通道编号	M	*/
  ChannelNo!: string;
  /**	String	描述	O	*/
  Description?: string;
}
