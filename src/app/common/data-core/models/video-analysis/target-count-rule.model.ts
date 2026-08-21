import { Type } from 'class-transformer';
import 'reflect-metadata';
import { IModel } from '../interface/model.interface';
import { TargetCount } from './target-count.model';

/**	TargetCountRule (目标计数规则)	*/
export class TargetCountRule implements IModel {
  /**	TargetCount[]	目标计数	M	*/
  @Type(() => TargetCount)
  TargetCounts!: TargetCount[];
  /**	Int32	逻辑运算符	M	*/
  LogicalOperatorType!: number;
}
