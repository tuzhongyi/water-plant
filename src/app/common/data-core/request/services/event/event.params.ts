import { PagedDurationParams } from '../../../models/interface/params.interface';

export class GetDeviceEventRecordsParams extends PagedDurationParams {
  /**	String[]	ID列表	O	*/
  Ids?: string[];
  /**	String	名称或描述	O	*/
  Name?: string;
  /**	Int32[]	事件类型	O	*/
  EventTypes?: number[];
}
