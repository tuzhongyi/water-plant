import { Transform, Type } from 'class-transformer';
import 'reflect-metadata';
import { IIdNameModel } from '../interface/model.interface';
import { Transformer } from '../transformer';
import { GisPoint } from './gis-point.model';
/**	MapElement (地图元素信息)	*/
export class GeoMapElement implements IIdNameModel {
  /**	String	地图元素ID	M	*/
  Id!: string;
  /**	String	元素名称	M	*/
  Name!: string;
  /**	Int32	地图元素类型	M	*/
  ElementType!: number;
  /**	String	系统访问元素唯一标识符，例如：ElementType：摄像机，此处为就是VideoChannel对象的ID	O	*/
  ElementId?: string;
  /**	String	父元素唯一标识符	O	*/
  ParentId?: string;
  /**	String	地图唯一标识符	M	*/
  MapId!: string;
  /**	String	描述信息	O	*/
  Description?: string;
  /**	String[]	标签	O	*/
  Tags?: string[];
  /**	GisPoint	元素所在位置	O	*/
  @Type(() => GisPoint)
  Location?: GisPoint;
  /**	DateTime	创建时间	M	*/
  @Transform(Transformer.datetime)
  CreateTime!: Date;
  /**	DateTime	更新时间	M	*/
  @Transform(Transformer.datetime)
  UpdateTime!: Date;
}
