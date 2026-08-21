import { PagedParams } from '../../../models/interface/params.interface';

export class GetRegionsParams extends PagedParams {
  /**	String[]	ID列表	O	*/
  Ids?: string[];
  /**	String	名称或描述	O	*/
  Name?: string;
  /**	Int32[]	区域类型	O	*/
  RegionTypes?: number[];
  /**	String	上级区域ID	O	*/
  ParentId?: string;
}

export class GetRegionResourcesParams extends PagedParams {
  /**	String	区域路径，支持部分查询	O	*/
  RegionPath?: string;
  /**	String	名称或描述	O	*/
  Name?: string;
  /**	Int32	资源类型	M	*/
  ResourceType!: number;
  /**	String	区域ID	O	*/
  RegionId?: string;
  /**	String[]	资源ID	O	*/
  ResourceIds?: string[];
}
