import { ObjectTool } from '../../../../common/tools/object-tool/object.tool';

export interface ISettingDeviceListTableArgs {
  state?: number;
  host?: string;
  name?: string;
  type?: number;
  serialnumber?: string;
  alarm?: boolean;
  synctime?: boolean;
}

export class SettingDeviceListTableArgs implements ISettingDeviceListTableArgs {
  state?: number;
  host?: string;
  name?: string;
  type?: number;
  serialnumber?: string;
  alarm?: boolean;
  synctime?: boolean;
  first = false;
}
export class SettingDeviceListTableFilter implements ISettingDeviceListTableArgs {
  state?: number;
  host?: string;
  name?: string;
  type?: number;
  serialnumber?: string;
  alarm?: boolean;
  synctime?: boolean;

  desc?: string;
  asc?: string;

  static from(args: SettingDeviceListTableArgs): SettingDeviceListTableFilter {
    let filter = ObjectTool.assign(args, SettingDeviceListTableFilter);
    return filter;
  }
}
