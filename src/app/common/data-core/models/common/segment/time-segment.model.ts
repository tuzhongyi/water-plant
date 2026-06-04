import { Transform } from 'class-transformer';
import { IModel } from '../../interface/model.interface';
import { Transformer } from '../../transformer';
import { Time } from '../time.model';

/**	TimeSegment (时间段)	*/
export class TimeSegment implements IModel {
  /**	Time	开始时间，00:00:00-23:59:59	M	*/
  @Transform(Transformer.time)
  StartTime!: Time;
  /**	Time	结束时间，00:00:00-23:59:59	M	*/
  @Transform(Transformer.time)
  StopTime!: Time;
}
