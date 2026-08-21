import { Type } from 'class-transformer';
import 'reflect-metadata';
import { EnumNameValue } from '../capabilities/enum-name-value.model';
import { IModel } from '../interface/model.interface';

/**	RegionCapability (区域能力)	*/
export class RegionCapability implements IModel {
  /**	EnumNameValue[]	资源类型	O	*/
  @Type(() => EnumNameValue)
  ResourceTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	区域类型	O	*/
  @Type(() => EnumNameValue)
  RegionTypes?: EnumNameValue<number>[];
  /**	EnumNameValue[]	区域结点类型	O	*/
  @Type(() => EnumNameValue)
  RegionNodeTypes?: EnumNameValue<number>[];
}
