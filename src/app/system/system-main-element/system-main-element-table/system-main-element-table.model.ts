export interface ISystemMainElementTableArgs {
  name?: string;
  type?: number;
  building?: string;
}
export class SystemMainElementTableArgs implements ISystemMainElementTableArgs {
  name?: string;
  type?: number;
  parent?: string;
  first?: boolean;
}

export interface SystemMainElementTableItem<T = any> {
  id: string;
  parent?: string;
  name: string;
  type: string;
  state: {
    name: string;
    color: string;
  };
  data: T;
}
