import { EnumNameValue } from '../../data-core/models/capabilities/enum-name-value.model';

export interface ISelection<T = any> {
  toggleNodes(value: EnumNameValue<T>, clear?: boolean | undefined): void;
}
