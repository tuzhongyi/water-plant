import { EnumNameValue } from '../../data-core/models/capabilities/enum-name-value.model';

export abstract class LanguageAbstract {
  protected get<T>(values: EnumNameValue<T>[], value?: T, def = ''): string {
    if (values) {
      let _enum = values.find((x) => x.Value == value);
      if (_enum) {
        return _enum.Name;
      }
    }
    return def;
  }
}
