import { IModel } from '../interface/model.interface';

/**	VideoAnalysisTaskCapability (视频分析任务能力)	*/
export class VideoAnalysisTaskCapability implements IModel {
  /**	Int32	任务类型	M	*/
  TaskType!: number;
  /**	String	任务名称	M	*/
  Name!: string;
  /**	Double	任务分析帧数量	O	*/
  FrameRate?: number;
  /**	Int32	规则类型	M	*/
  RuleType!: number;
  /**	Int32[]	支持的检测目标类型，可以多选	O	*/
  TargetTypes?: number[];
  /**	Int32	最大规则数量，默认：4	O	*/
  MaxRuleCount?: number;
  /**	String[]	有效规则字段	O	*/
  ValidRuleFields?: string[];
  /**	String	描述内容	O	*/
  Description?: string;
}
