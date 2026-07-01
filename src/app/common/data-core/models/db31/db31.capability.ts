import { Type } from 'class-transformer';
import 'reflect-metadata';
import { EnumNameValue } from '../capabilities/enum-name-value.model';
import { IModel } from '../interface/model.interface';
/**	DeviceCapability (设备能力)	*/
export class DB31Capability implements IModel {
  /**	EnumNameValue[]	设备类型	O	*/
  @Type(() => EnumNameValue)
  DeviceTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	设备状态	O	*/
  @Type(() => EnumNameValue)
  DeviceStates?: EnumNameValue<number>[];
}
