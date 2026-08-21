import { Type } from 'class-transformer';
import 'reflect-metadata';
import { IModel } from '../interface/model.interface';
import { TargetRate } from './target-rate.model';

/**	TargetRateRule (目标比例规则)	*/
export class TargetRateRule implements IModel {
  /**	TargetRate[]	计数比例	M	*/
  @Type(() => TargetRate)
  TargetRates!: TargetRate[];
  /**	Int32	算数操作符，比例计算方式	M	*/
  ArithmeticOperatorType!: number;
}
