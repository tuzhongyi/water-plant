import { Transform } from 'class-transformer';
import { IIdNameModel } from '../interface/model.interface';
import { Transformer } from '../transformer';

/**	VideoFileDownloadTask (视频文件下载任务)	*/
export class VideoFileDownloadTask implements IIdNameModel {
  /**	String	唯一ID	M	*/
  Id!: string;
  /**	String	名称	M	*/
  Name!: string;
  /**	String	视频通道Id	M	*/
  VideoChannelId!: string;
  /**	DateTime	开始时间	M	*/
  @Transform(Transformer.datetime)
  BeginTime!: Date;
  /**	DateTime	结束时间	M	*/
  @Transform(Transformer.datetime)
  EndTime!: Date;
  /**	Double	下载进度，0-100	M	*/
  Progress!: number;
  /**	Int32	状态，0-未开始，1-进行中，2-完成，3-故障。	M	*/
  State!: number;
  /**	Boolean	文件是否存在	O	*/
  FileExisted?: boolean;
  /**	String	文件下载路径	O	*/
  FileUrl?: string;
}
