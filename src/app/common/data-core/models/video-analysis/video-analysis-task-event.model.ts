import { Transform, Type } from 'class-transformer';
import 'reflect-metadata';
import { EventDataObject } from '../events/event-data-object.model';
import { IIdModel } from '../interface/model.interface';
import { Transformer } from '../transformer';

/**	VideoAnalysisTaskEvent (视频分析任务事件)	*/
export class VideoAnalysisTaskEvent implements IIdModel {
  /**	String	事件唯一ID	M	*/
  Id!: string;
  /**	String	任务唯一ID	M	*/
  TaskId!: string;
  /**	String	任务名称	M	*/
  TaskName!: string;
  /**	DateTime	事件时间	M	*/
  @Transform(Transformer.datetime)
  Time!: Date;
  /**	Int32	视频任务类型	M	*/
  TaskType!: number;
  /**	Int32	事件触发类型	M	*/
  TriggerType!: number;
  /**	EventDataObject[]	目标	O	*/
  @Type(() => EventDataObject)
  Objects?: EventDataObject[];
  /**	Double	置信度：0-100	M	*/
  Confidence!: number;
  /**	String	描述信息	O	*/
  Description?: string;
}
