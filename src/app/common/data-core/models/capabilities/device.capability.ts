import { Type } from 'class-transformer';
import 'reflect-metadata';
import { IModel } from '../interface/model.interface';
import { EnumNameValue } from './enum-name-value.model';
/**	DeviceCapability (设备能力)	*/
export class DeviceCapability implements IModel {
  /**	EnumNameValue[]	设备协议类型	O	*/
  @Type(() => EnumNameValue)
  ProtocolTypes?: EnumNameValue[];
  /**	EnumNameValue[]	设备类型	O	*/
  @Type(() => EnumNameValue)
  DeviceTypes?: EnumNameValue[];
  /**	EnumNameValue[]	音频格式类型	O	*/
  @Type(() => EnumNameValue)
  AudioFormats?: EnumNameValue[];
  /**	EnumNameValue[]	视频格式类型	O	*/
  @Type(() => EnumNameValue)
  VideoFormats?: EnumNameValue[];
  /**	EnumNameValue[]	设备状态	O	*/
  @Type(() => EnumNameValue)
  DeviceStates?: EnumNameValue[];
}
