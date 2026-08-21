import { Type } from 'class-transformer';
import 'reflect-metadata';
import { Point } from '../common/point.model';
import { IModel } from '../interface/model.interface';
import { TargetCountRule } from './target-count-rule.model';
import { TargetRateRule } from './target-rate-rule.model';
import { TargetSize } from './target-size.model';

/**	VideoAnalysisTaskRule (视频分析任务规则)	*/
export class VideoAnalysisTaskRule implements IModel {
  /**	Int32	规则编号[1-4]	M	*/
  Id!: number;
  /**	Boolean	是否启用	M	*/
  Enabled!: boolean;
  /**	String	规则名称	M	*/
  Name!: string;
  /**	TargetSize	最小目标尺寸	O	*/
  @Type(() => TargetSize)
  MinTargetSize?: TargetSize;
  /**	TargetSize	最大目标尺寸	O	*/
  @Type(() => TargetSize)
  MaxTargetSize?: TargetSize;
  /**	Point[]	检测区域	O	*/
  @Type(() => Point)
  Area?: Point[];
  /**	Point[]	检测线段，尽量是一条直线	O	*/
  @Type(() => Point)
  Line?: Point[];
  /**	Int32	线段或区域方向	O	*/
  Direction?: number;
  /**	Int32	灵敏度：0-100	O	*/
  Sensitivity?: number;
  /**	Int32[]	检测目标类型	O	*/
  TargetTypes?: number[];
  /**	Int32	时间阈值，单位：秒 0-n	O	*/
  TimeThreshold?: number;
  /**	Int32	最大报警次数，如果数值是0就一直报警	O	*/
  MaxAlarmTimes?: number;
  /**	Int32	报警间隔，单位：秒0-n	O	*/
  AlarmInterval?: number;
  /**	TargetRateRule	计数比例，羁押比	O	*/
  @Type(() => TargetRateRule)
  TargetRateRule?: TargetRateRule;
  /**	TargetCountRule	目标计数	O	*/
  @Type(() => TargetCountRule)
  TargetCountRule?: TargetCountRule;
}
