import { IParams, PagedParams } from '../../../models/interface/params.interface';

/**	UserAndPassword (用户名密码)	*/
export class UserAndPassword implements IParams {
  /**	String	用户名	M	*/
  Username!: string;
  /**
   * String
   * "密码，查询时不会出现
   * 密码内容为：SM4加密"
   * O
   **/
  Password?: string;
}

export class GetUsersParams extends PagedParams {
  /**	String[]	ID列表	O	*/
  Ids?: string[];
  /**	String	用户名称或描述	O	*/
  Name?: string;
  /**	String	用户分组ID	O	*/
  GroupId?: string;
}
export class GetUserGroupsParams extends PagedParams {
  /**	String	名称或描述	O	*/
  Name?: string;
  /**	String[]	ID列表	O	*/
  Ids?: string[];
}
