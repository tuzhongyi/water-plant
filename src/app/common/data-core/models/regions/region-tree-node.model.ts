import { Type } from 'class-transformer';
import 'reflect-metadata';
import { IIdNameModel } from '../interface/model.interface';

/**	RegionTreeNode (区域结点)	*/
export class RegionTreeNode implements IIdNameModel {
  /**	String	唯一ID	M	*/
  Id!: string;
  /**	String	名称	M	*/
  Name!: string;
  /**	String	描述信息	O	*/
  Description?: string;
  /**	Int32	区域结点类型	M	*/
  RegionNodeType!: number;
  /**	Int32	结点类型	M	*/
  NodeType!: number;
  /**	Int32	同级别区域排序编号	M	*/
  Sort!: number;
  /**	RegionTreeNode[]	子区域	O	*/
  @Type(() => RegionTreeNode)
  Children?: RegionTreeNode[];
  /**	Boolean	展开状态（筛选时前端计算，非接口字段）	O	*/
  expanded?: boolean;
}
