import { Type } from 'class-transformer';
import 'reflect-metadata';
import { IModel } from '../../interface/model.interface';
import { TimeSegment } from './time-segment.model';
/**	DayTimeSegment (每日工作表时间段)	*/
export class DayTimeSegment implements IModel {
  /**	Int32	星期几0-6	M	*/
  DayOfWeek!: number;
  /**	TimeSegment[]	工作时间段，最多4个时间段	O	*/
  @Type(() => TimeSegment)
  Segments?: TimeSegment[];
}
