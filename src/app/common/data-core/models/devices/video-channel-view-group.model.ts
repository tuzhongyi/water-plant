import { Type } from 'class-transformer';
import 'reflect-metadata';
import { IIdNameModel } from '../interface/model.interface';
import { VideoChannelView } from './video-channel-view.model';

/**	VideoChannelViewGroup (视频预览分组)	*/
export class VideoChannelViewGroup implements IIdNameModel {
  /**	String	唯一ID	M	*/
  Id!: string;
  /**	String	分组名称	M	*/
  Name!: string;
  /**	Int32	排序编号	M	*/
  Sort!: number;
  /**	Int32	视频画面总分割数量，1、4、9、16	M	*/
  ViewNumber!: number;
  /**	VideoChannelView[]	视频画面信息	M	*/
  @Type(() => VideoChannelView)
  Views!: VideoChannelView[];
}
