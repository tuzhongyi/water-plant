import { Type } from 'class-transformer';
import { EnumNameValue } from '../capabilities/enum-name-value.model';
import { IModel } from '../interface/model.interface';

/**	EventCapability (事件记录能力)	*/
export class EventCapability implements IModel {
  /**	EnumNameValue[]	事件类型	O	*/
  @Type(() => EnumNameValue)
  EventTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	资源类型	O	*/
  @Type(() => EnumNameValue)
  ResourceTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	触发类型	O	*/
  @Type(() => EnumNameValue)
  TriggerTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	联动行为类型	O	*/
  @Type(() => EnumNameValue)
  BehaviorTypes?: EnumNameValue<number>[];
}
