import { Transform, Type } from 'class-transformer';
import 'reflect-metadata';
import { IdAndName } from '../../common/id-name.model';
import { IIdNameModel } from '../../interface/model.interface';
import { Transformer } from '../../transformer';
/**	UserGroup (用户分组信息)	*/
export class UserGroup implements IIdNameModel {
  /**	String	分组唯一ID	M	*/
  Id!: string;
  /**	String	分组名称	M	*/
  Name!: string;
  /**	IdAndName[]	设备权限(无效)	O	*/
  @Type(() => IdAndName)
  Devices?: IdAndName[];
  /**	IdAndName[]	视频通道权限(无效)	O	*/
  @Type(() => IdAndName)
  VideoChannels?: IdAndName[];
  /**	Boolean	是否为Root权限用户组	M	*/
  IsRoot!: boolean;
  /**
   * Int32[]
   * 支持的权限类型
   * 1：视频预览
   * 2：视频回放
   * 3：视频下载
   * 4：PTZ控制
   * 5：报警设置
   * 6：门禁控制
   * O
   **/
  Priorities?: number[];
  /**	String	用户描述	O	*/
  Description?: string;
  /**	DateTime	创建时间	O	*/
  @Transform(Transformer.datetime)
  CreationTime?: Date;
  /**	DateTime	更新时间	O	*/
  @Transform(Transformer.datetime)
  UpdateTime?: Date;
}
