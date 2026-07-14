import { Transform, Type } from 'class-transformer';
import 'reflect-metadata';
import { IIdModel } from '../interface/model.interface';
import { Transformer } from '../transformer';
import { EventBehaviorAction } from './event-behavior-action.model';

/**	EventBehavior (事件联动行为)	*/
export class EventBehavior implements IIdModel {
  /**	String	记录ID	M	*/
  Id!: string;
  /**	Int32	事件类型	M	*/
  EventType!: number;
  /**	String	描述内容	O	*/
  Description?: string;
  /**	DateTime	创建时间	O	*/
  @Transform(Transformer.datetime)
  CreateTime?: Date;
  /**	DateTime	更新时间	O	*/
  @Transform(Transformer.datetime)
  UpdateTime?: Date;
  /**	String	触发条件设备ID （如果填写，将根据ResourceId获取）	O	*/
  DeviceId?: string;
  /**	String	触发条件设备名称（如果填写，将根据ResourceId获取）	O	*/
  DeviceName?: string;
  /**	String	触发条件资源ID	O	*/
  ResourceId?: string;
  /**	String	触发条件资源名称	O	*/
  ResourceName?: string;
  /**	String	触发条件通道编号	O	*/
  ChannelNo?: string;
  /**	Boolean	是否来自于DB31设备	O	*/
  FromDB31?: boolean;
  /**	EventBehaviorAction[]	动作列表	O	*/
  @Type(() => EventBehaviorAction)
  Actions?: EventBehaviorAction[];
}
