import { Transform, Type } from 'class-transformer';
import 'reflect-metadata';
import { IIdNameModel } from '../interface/model.interface';
import { Transformer } from '../transformer';
import { GisPoint } from './gis-point.model';
/**	Map (地图信息)	*/
export class GeoMap implements IIdNameModel {
  /**	String	唯一标识符	M	*/
  Id!: string;
  /**	String	MD5字符串	O	*/
  MD5?: string;
  /**	String	地图名称	M	*/
  Name!: string;
  /**	Int32	地图类型(保留)，默认：1	M	*/
  MapType!: number;
  /**	DateTime	创建时间	M	*/
  @Transform(Transformer.datetime)
  CreateTime!: Date;
  /**	DateTime	更新时间	M	*/
  @Transform(Transformer.datetime)
  UpdateTime!: Date;
  /**	String	描述信息	O	*/
  Description?: string;
  /**	String	地图文件URL	O	*/
  FileUrl?: string;
  /**	GisPoint	元素所在位置	O	*/
  @Type(() => GisPoint)
  Location?: GisPoint;
}
