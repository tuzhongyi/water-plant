import { Transform } from 'class-transformer';
import { IIdModel } from '../../interface/model.interface';
import { Transformer } from '../../transformer';

/**	User (用户信息)	*/
export class User implements IIdModel {
  /**	String	用户唯一ID	M	*/
  Id!: string;
  /**	String	用户名	M	*/
  Username!: string;
  /**	String	"密码，查询时不会出现
密码内容为：SM4加密"	O	*/
  Password?: string;
  /**	String	用户描述	O	*/
  Description?: string;
  /**	String	名称	O	*/
  Name?: string;
  /**	DateTime	创建时间	O	*/
  @Transform(Transformer.datetime)
  CreationTime?: Date;
  /**	DateTime	更新时间	O	*/
  @Transform(Transformer.datetime)
  UpdateTime?: Date;
  /**	String	所属用户组	M	*/
  GroupId!: string;
  /**	String[]	第三方Tokens，暂时无效	O	*/
  BearerTokens?: string[];
  /**	String	分组名称	O	*/
  GroupName?: string;
}
