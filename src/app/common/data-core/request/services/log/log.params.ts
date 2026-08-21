import { PagedDurationParams } from '../../../models/interface/params.interface';

export class GetLogRecordsParams extends PagedDurationParams {
  /**	Int32[]	日志类型	O	*/
  LogTypes?: number[];
  /**	String	内容，LIKE	O	*/
  Content?: string;
  /**	String	用户名	O	*/
  Username?: string;
  /**	String	升序字段	O	*/
  Asc?: string;
  /**	String	降序字段	O	*/
  Desc?: string;
}
