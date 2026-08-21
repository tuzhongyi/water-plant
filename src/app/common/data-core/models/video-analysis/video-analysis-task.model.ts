import { Transform, Type } from 'class-transformer';
import 'reflect-metadata';
import { WeekTimeSegment } from '../common/segment/week-time-segment.model';
import { IIdModel } from '../interface/model.interface';
import { Transformer } from '../transformer';
import { VideoAnalysisTaskRule } from './video-analysis-task-rule.model';

/**	VideoAnalysisTask (视频分析任务)	*/
export class VideoAnalysisTask implements IIdModel {
  /**	String	唯一ID	M	*/
  Id!: string;
  /**	String	任务名称	M	*/
  Name!: string;
  /**	String	设备ID	M	*/
  DeviceId!: string;
  /**	String	设备名称	M	*/
  DeviceName!: string;
  /**	String	视频通道ID	M	*/
  VideoChannelId!: string;
  /**	String	视频通道名称	M	*/
  VideoChannelName!: string;
  /**	String	视频地址，一般是RTSP	M	*/
  VideoUrl!: string;
  /**	String	用户名	O	*/
  Username?: string;
  /**	String	密码	O	*/
  Password?: string;
  /**	String	描述信息	O	*/
  Description?: string;
  /**	Boolean	是否启用工作表，默认：false	O	*/
  ScheduleEnabled?: boolean;
  /**	WeekTimeSegment	周工作表	O	*/
  @Type(() => WeekTimeSegment)
  Schedule?: WeekTimeSegment;
  /**	Int32	视频任务类型	M	*/
  TaskType!: number;
  /**	VideoAnalysisTaskRule[]	分析规则	O	*/
  @Type(() => VideoAnalysisTaskRule)
  Rules?: VideoAnalysisTaskRule[];
  /**	DateTime	创建时间	O	*/
  @Transform(Transformer.datetime)
  CreationTime?: Date;
  /**	DateTime	更新时间	O	*/
  @Transform(Transformer.datetime)
  UpdateTime?: Date;
  /**	Boolean	是否已部署	O	*/
  Deployed?: boolean;
  /**	String	部署到分析服务器ID	O	*/
  DeploymentDeviceId?: string;
  /**	String	部署到分析服务器名称	O	*/
  DeploymentDeviceName?: string;
  /**	Int32	任务状态	O	*/
  TaskState?: number;
}
