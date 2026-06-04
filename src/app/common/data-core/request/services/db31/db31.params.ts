import { PagedParams } from '../../../models/interface/params.interface';

export class GetDB31DevicesParams extends PagedParams {
  /**	String[]	ID列表	O	*/ Ids?: string[];
  /**	String	名称或描述	O	*/ Name?: string;
  /**	Int32[]	设备类型	O	*/ DeviceTypes?: number[];
  /**	Int32	设备状态	O	*/ DeviceState?: number;
  /**	String	DB31的ID	O	*/ DB31Id?: string;
}
export class GetDB31DeviceChannelsParams extends PagedParams {
  /**	String[]	ID列表	O	*/ Ids?: string[];
  /**	String	名称或描述	O	*/ Name?: string;
  /**	String	设备ID	O	*/ DeviceId?: string;
  /**	String	DB31的ID	O	*/ DB31Id?: string;
  /**	String	通道编号	O	*/ ChannelNo?: string;
}
