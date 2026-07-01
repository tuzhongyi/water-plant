import { ObjectTool } from '../../../../common/tools/object-tool/object.tool';

export interface ISettingMapElementTableArgs {
  name?: string;
  type?: number;
  parent?: string;
}

export class SettingMapElementTableArgs implements ISettingMapElementTableArgs {
  name?: string;
  type?: number;
  parent?: string;
  first = false;
}

export class SettingMapElementTableFilter implements ISettingMapElementTableArgs {
  name?: string;
  type?: number;
  parent?: string;

  static from(args: SettingMapElementTableArgs): SettingMapElementTableFilter {
    let filter = ObjectTool.assign(args, SettingMapElementTableFilter);
    return filter;
  }
}
