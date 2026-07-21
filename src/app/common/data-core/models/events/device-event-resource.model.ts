import { Type } from 'class-transformer';
import 'reflect-metadata';
import { IModel } from '../interface/model.interface';
import { EventDataObject } from './event-data-object.model';
/**	DeviceEventResource (事件资源)	*/
export class DeviceEventResource implements IModel {
  /**	String	资源ID	M	*/
  ResourceId!: string;
  /**	Int32	资源类型	M	*/
  ResourceType!: number;
  /**	String	资源名称	M	*/
  ResourceName!: string;
  /**	Int32	通道编号	O	*/
  ChannelNo?: number;
  /**	EventDataObject[]	目标	O	*/
  @Type(() => EventDataObject)
  Objects?: EventDataObject[];
  /**	String	图片地址	O	*/
  ImageUrl?: string;
  /**	String	数值 门禁设备：开门人员名称	O	*/
  Value?: string;
}
