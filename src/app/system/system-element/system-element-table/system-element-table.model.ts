import { ObjectTool } from '../../../common/tools/object-tool/object.tool';

export interface ISystemElementTableArgs {
  name?: string;
  type?: number;
  buildingId?: string;
}

export class SystemElementTableArgs implements ISystemElementTableArgs {
  name?: string;
  type?: number;
  buildingId?: string;
  first = false;
}

export class SystemElementTableFilter implements ISystemElementTableArgs {
  name?: string;
  type?: number;
  buildingId?: string;

  static from(args: SystemElementTableArgs): SystemElementTableFilter {
    let filter = ObjectTool.assign(args, SystemElementTableFilter);
    return filter;
  }
}

export interface SystemElementTableItem<T = any> {
  id: string;
  name: string;
  type: Promise<string>;
  parent: Promise<string>;
  statename: Promise<string>;
  statecolor: string;
  canplay: boolean;
  data: T;
}
