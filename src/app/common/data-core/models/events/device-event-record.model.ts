import { Transform, Type } from 'class-transformer';
import 'reflect-metadata';
import { IIdModel } from '../interface/model.interface';
import { Transformer } from '../transformer';
import { DeviceEventResource } from './device-event-resource.model';
import { EventBehaviorAction } from './event-behavior-action.model';
/**	DeviceEventRecord (设备事件记录)	*/
export class DeviceEventRecord implements IIdModel {
  /**	String	事件ID	M	*/ Id!: string;
  /**	DateTime	事件时间	M	*/
  @Transform(Transformer.datetime) EventTime!: Date;
  /**	DateTime	开始时间	O	*/
  @Transform(Transformer.datetime) BeginTime?: Date;
  /**	DateTime	结束时间	O	*/
  @Transform(Transformer.datetime) EndTime?: Date;
  /**	String	描述内容	O	*/
  Description?: string;
  /**	BASE64	扩展数据	O	*/
  ExtensionData?: string;
  /**	Int32	事件类型	M	*/
  EventType!: number;
  /**	String	事件描述信息	O	*/
  EventDescription?: string;
  /**	String	设备ID	O	*/
  DeviceId?: string;
  /**	String	设备名称	O	*/
  DeviceName?: string;
  /**	Boolean	是否来自于DB31设备	O */
  FromDB31?: boolean;

  /**	String	图片ID、图片地址	O	*/
  ImageUrl?: string;
  /**	Int32	事件触发类型	M	*/
  TriggerType!: number;
  /**	DeviceEventResource	报警资源	O	*/
  @Type(() => DeviceEventResource)
  Resource?: DeviceEventResource;

  /**	EventBehaviorAction[]	联动行为	O */
  @Type(() => EventBehaviorAction)
  Actions?: EventBehaviorAction;
}
