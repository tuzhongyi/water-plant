import { IModel } from '../interface/model.interface';

/**	VideoChannelView (视频预览分组子项)	*/
export class VideoChannelView implements IModel {
  /**	Int32	视频画面编号：1-16	M	*/
  ViewNo!: number;
  /**	String	通道ID	M	*/
  VideoChannelId!: string;
  /**	String	通道名称	M	*/
  VideoChannelName!: string;
  /**	Int32	流类型：1-主码流，2-子码流	M	*/
  StreamType!: number;
}
