import { Transform } from 'class-transformer';
import { IIdNameModel } from '../interface/model.interface';
import { Transformer } from '../transformer';

/**	Region (区域)	*/
export class Region implements IIdNameModel {
  /**	String	唯一ID	M	*/
  Id!: string;
  /**	String	名称	M	*/
  Name!: string;
  /**	String	描述信息	O	*/
  Description?: string;
  /**	Int32	区域类型	M	*/
  RegionType!: number;
  /**	String	区域完整目录	O	*/
  RegionPath?: string;
  /**	String	上级区域ID	O	*/
  ParentId?: string;
  /**	Int32	同级别区域排序编号	M	*/
  Sort!: number;
  /**	Boolean	是否为叶子节点	O	*/
  IsLeaf?: boolean;
  /**	DateTime	创建时间	O	*/
  @Transform(Transformer.datetime)
  CreationTime?: Date;
  /**	DateTime	更新时间	O	*/
  @Transform(Transformer.datetime)
  UpdateTime?: Date;
}
