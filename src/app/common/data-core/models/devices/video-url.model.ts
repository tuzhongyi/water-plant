import { IModel } from '../interface/model.interface';

/**	VideoUrl (视频Url地址)	*/
export class VideoUrl implements IModel {
  /**	String	Url地址	M	*/ Url!: string;
  /**	String	用户名	O	*/ Username?: string;
  /**	String	密码	O	*/ Password?: string;
}
