import { IModel } from '../interface/model.interface';

/**	FaceSnapSettings (人脸抓拍策略参数)	*/
export class FaceSnapSettings implements IModel {
  /**	Boolean	是否启用，	M	*/
  Enabled!: boolean;
  /**	String	接入用户编号，欣能提供	M	*/
  UserCode!: string;
  /**
   * String
   * "接入接口地址，欣能提供http://IP:PORT/ibh/publishUserPhoto"
   * M
   **/
  FaceSnapUploadUrl!: string;
  /**	Double	人脸评分过滤，0-100分，0-不启动	M	*/
  FaceScoreFilterValue!: number;
  /**	Double	过滤时长，单位：秒，默认5秒	M	*/
  FilterDuration!: number;
  /**	Boolean	是否启用白名单过滤，启用后过滤和白名单匹配的人脸抓拍	M	*/
  WhiteListFilterEnabled!: boolean;
  /**	Boolean	白名单排斥过滤，启用后过滤所有过滤时长中的人脸抓拍	M	*/
  WhiteListExclusionEnabled!: boolean;
}
