import { IModel } from '../interface/model.interface';

/**	RegionResource (区域资源)	*/
export class RegionResource implements IModel {
  /**	String	所属区域ID(创建后不可修改)	M	*/
  RegionId!: string;
  /**	String	资源ID。(创建后不可修改)	M	*/
  ResourceId!: string;
  /**	Int32	资源类型(创建后不可修改)	M	*/
  ResourceType!: number;
  /**	String	资源名称	M	*/
  ResourceName!: string;
  /**	String	描述信息	O	*/
  Description?: string;
  /**	Int32	同级别区域排序编号	M	*/
  Sort!: number;
}
