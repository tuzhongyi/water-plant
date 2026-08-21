import { Transform, Type } from 'class-transformer';
import 'reflect-metadata';
import { EventDataObject } from '../events/event-data-object.model';
import { IIdModel } from '../interface/model.interface';
import { Transformer } from '../transformer';
import { VideoAnalysisTaskRule } from './video-analysis-task-rule.model';

/**	VideoAnalysisTaskEventRecord (事件记录)	*/
export class VideoAnalysisTaskEventRecord implements IIdModel {
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
  /**	DateTime	开始时间	O	*/
  @Transform(Transformer.datetime)
  BeginTime?: Date;
  /**	DateTime	结束时间	O	*/
  @Transform(Transformer.datetime)
  EndTime?: Date;
  /**	String	图片地址	O	*/
  ImageUrl?: string;
  /**	String	设备ID	O	*/
  DeviceId?: string;
  /**	String	设备名称	O	*/
  DeviceName?: string;
  /**	String	视频通道	O	*/
  VideoChannelId?: string;
  /**	String	视频通道名称	O	*/
  VideoChannelName?: string;
  /**	String	录像文件地址（本地文件路径）	O	*/
  RecordUrl?: string;
  /**	VideoAnalysisTaskRule[]	分析规则	O	*/
  @Type(() => VideoAnalysisTaskRule)
  Rules?: VideoAnalysisTaskRule[];
  /**	String	全局唯一ID	O	*/
  Guid?: string;
}
