import { Type } from 'class-transformer';
import 'reflect-metadata';
import { EnumNameValue } from '../capabilities/enum-name-value.model';
import { IModel } from '../interface/model.interface';

/**	VideoAnalysisCapability (视频分析能力)	*/
export class VideoAnalysisCapability implements IModel {
  /**	EnumNameValue[]	设备类型	O	*/
  @Type(() => EnumNameValue)
  DeviceTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	协议类型	O	*/
  @Type(() => EnumNameValue)
  ProtocolTypes?: EnumNameValue[];
  /**	EnumNameValue[]	分析任务类型	O	*/
  @Type(() => EnumNameValue)
  TaskTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	分析规则类型	O	*/
  @Type(() => EnumNameValue)
  RuleTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	分析目标类型	O	*/
  @Type(() => EnumNameValue)
  TargetTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	分析规则方向	O	*/
  @Type(() => EnumNameValue)
  RuleDirections?: EnumNameValue<number>[];
  /**	EnumNameValue[]	算数操作符类型	O	*/
  @Type(() => EnumNameValue)
  ArithmeticOperatorTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	逻辑操作符类型	O	*/
  @Type(() => EnumNameValue)
  LogicalOperatorTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	任务状态	O	*/
  @Type(() => EnumNameValue)
  TaskStates?: EnumNameValue<number>[];
}
