import { IModel } from '../interface/model.interface';

/**	TargetRate (目标比例)	*/
export class TargetRate implements IModel {
  /**	Int32	目标类型	M	*/
  TargetType!: number;
  /**	Int32	目标数量	M	*/
  TargetCount!: number;
}
