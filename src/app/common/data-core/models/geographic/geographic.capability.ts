import { Type } from 'class-transformer';
import { EnumNameValue } from '../capabilities/enum-name-value.model';
import { IModel } from '../interface/model.interface';

/**	GeographicCapability (地理信息能力)	*/
export class GeographicCapability implements IModel {
  /**	ElementTypes[]	地图元素类型	O	*/
  @Type(() => EnumNameValue)
  ElementTypes?: EnumNameValue<number>[];
  /**	ElementStates[]	地图元素状态	O	*/
  @Type(() => EnumNameValue)
  ElementStates?: EnumNameValue<number>[];
}
