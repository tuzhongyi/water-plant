import { PagedParams } from '../../../../models/interface/params.interface';

export class GetDB31DeviceChannelsParams extends PagedParams {
  /**	String[]	ID列表	O	*/
  Ids?: string[];
  /**	String	名称或描述	O	*/
  Name?: string;
  /**	String	设备ID	O	*/
  DeviceId?: string;
  /**	String	DB31的ID	O	*/
  DB31Id?: string;
  /**	String	通道编号	O	*/
  ChannelNo?: string;
}
