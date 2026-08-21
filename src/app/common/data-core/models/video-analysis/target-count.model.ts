import { IModel } from '../interface/model.interface';

/**	TargetCount (目标计数)	*/
export class TargetCount implements IModel {
  /**	Int32	目标类型	M	*/
  TargetType!: number;
  /**	Int32	数量上限，区域计数	O	*/
  CountUpperLimit?: number;
  /**	Int32	数量下限，区域计数	O	*/
  CountLowerLimit?: number;
}
