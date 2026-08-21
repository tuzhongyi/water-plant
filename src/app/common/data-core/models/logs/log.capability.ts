import { Type } from 'class-transformer';
import 'reflect-metadata';
import { EnumNameValue } from '../capabilities/enum-name-value.model';
import { IModel } from '../interface/model.interface';

/**	LogCapability (日志能力)	*/
export class LogCapability implements IModel {
  /**	EnumNameValue[]	日志类型	O	*/
  @Type(() => EnumNameValue)
  LogTypes?: EnumNameValue<number>[];
}
