import { PagedDurationParams, PagedParams } from '../../../models/interface/params.interface';

export class GetDeviceEventRecordsParams extends PagedDurationParams {
  /**	String[]	ID列表	O	*/
  Ids?: string[];
  /**	String	名称或描述	O	*/
  Name?: string;
  /**	Int32[]	事件类型	O	*/
  EventTypes?: number[];
  /**	String	升序字段	O */
  Asc?: string;
  /**	String	降序字段	O */
  Desc?: string;
}

export class GetEventBehaviorsParams extends PagedParams {
  /**	String[]	ID列表	O	*/
  Ids?: string[];
  /**	String[]	设备ID	O	*/
  DeviceIds?: string[];
  /**	String	名称或描述	O	*/
  Name?: string;
  /**	Int32[]	事件类型	O	*/
  EventTypes?: number[];
  /**	Boolean	来自DB31设备	O	*/
  FromDB31?: boolean;
  /**	String	升序字段	O */
  Asc?: string;
  /**	String	降序字段	O */
  Desc?: string;
}
