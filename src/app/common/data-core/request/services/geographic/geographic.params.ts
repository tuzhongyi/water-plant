import { PagedParams } from '../../../models/interface/params.interface';

export class GetMapElementsParams extends PagedParams {
  /**	String[]	元素ID列表	O	*/
  Ids?: string[];
  /**	String	名称或描述	O	*/
  Name?: string;
  /**	Int32[]	地图元素类型	O	*/
  ElementTypes?: number[];
  /**	String	地图ID	O	*/
  MapId?: string;
  /**	String	父元素ID	O	*/
  ParentId?: string;
  /**	String[]	地图元素ID列表	O*/
  ElementIds?: string[];
}
