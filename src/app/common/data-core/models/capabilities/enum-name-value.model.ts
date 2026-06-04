import { Transform } from 'class-transformer';
import { IModel } from '../interface/model.interface';

export class NameValue<T = string> implements IModel {
  constructor(value?: T, name?: string) {
    if (value !== undefined) {
      this.Value = value;
    }
    if (name) {
      this.Name = name;
    }
  }
  /**	String	枚举数值	M	*/
  @Transform(
    (e) => {
      let int = parseInt(`${e.value}`);
      if (isNaN(int)) {
        return e.value;
      }
      return int;
    },
    { toClassOnly: true }
  )
  Value!: T;
  /**	String	枚举名称	M	*/
  Name!: string;
}
/**	EnumNameValue (枚举类型)	*/
export class EnumNameValue<T = string> extends NameValue<T> {}
