import { Type } from 'class-transformer';
import 'reflect-metadata';
import { Point } from '../common/point.model';
import { IIdModel } from '../interface/model.interface';
/**	EventDataObject (事件目标)	*/
export class EventDataObject implements IIdModel {
  /**	String	目标ID	M	*/ Id!: string;
  /**	Point[]	目标所在的归一化多边形	M	*/
  @Type(() => Point)
  Polygon!: Point[];
  /**	Double	置信度：0-100	M	*/ Confidence!: number;
  /**	String	招牌名称	O	*/ Description?: string;
}
