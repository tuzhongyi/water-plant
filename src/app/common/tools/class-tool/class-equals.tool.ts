import { EnumNameValue } from '../../data-core/models/capabilities/enum-name-value.model';

export class ClassEqualsTool {
  array(a: number[], b: number[]): boolean {
    if (a.length != b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }

  EnumNameValue<T>(a: EnumNameValue<T>, b: EnumNameValue<T>): boolean {
    return a.Value === b.Value;
  }
}
