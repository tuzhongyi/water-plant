import { IModel } from '../interface/model.interface';

/**	EventBehaviorAction (事件联动行为动作)	*/
export class EventBehaviorAction implements IModel {
  /**	Int32	联动行为，目前只有预览	M	*/
  BehaviorType!: number;
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
}
