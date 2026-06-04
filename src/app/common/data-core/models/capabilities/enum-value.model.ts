import { IModel } from '../interface/model.interface';

/**	EnumValue (枚举数据)	*/
export class EnumValue implements IModel {
  /**	Int32	值 0，1	M	*/
  Value!: number;
  /**	Int32	模型给出的值	M	*/
  ModelValue!: number;
  /**	String	描述 空桶，小半桶	M	*/
  Description!: string;
}
