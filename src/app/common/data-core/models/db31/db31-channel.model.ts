import { IIdNameModel } from '../interface/model.interface';

/**	DB31Channel (DB31设备通道)	*/
export class DB31Channel implements IIdNameModel<string, string | undefined> {
  /**	String	ID	M	*/
  Id!: string;
  /**	String	DB31系统ID	O	*/
  DB31Id?: string;
  /**	String	设备ID	M	*/
  DeviceId!: string;
  /**	String	名称	O	*/
  Name: string | undefined;
  /**	String	通道编号	M	*/
  ChannelNo!: string;
  /**	String	描述	O	*/
  Description?: string;
  /**	Int32	设备类型	M	*/
  DeviceType!: number;
}
