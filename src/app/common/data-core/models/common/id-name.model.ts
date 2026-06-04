import { IIdNameModel } from '../interface/model.interface';

/**	IdAndName (Id和名称)	*/
export class IdAndName implements IIdNameModel {
  /**	String	ID	M	*/
  Id!: string;
  /**	String	名称	M	*/
  Name!: string;
}
