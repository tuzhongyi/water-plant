import { IModel } from '../interface/model.interface';

/**	TargetSize (目标大小)	*/
export class TargetSize implements IModel {
  /**	Double	目标宽度，相对视频图片的归一化大小	M	*/
  Width!: number;
  /**	Double	目标高度，相对视频图片的归一化大小	M	*/
  Height!: number;
}
