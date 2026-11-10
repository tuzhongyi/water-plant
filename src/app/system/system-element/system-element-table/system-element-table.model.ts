import { ObjectTool } from '../../../common/tools/object-tool/object.tool';

export interface ISystemElementTableArgs {
  name?: string;
  type?: number;
  buildingId?: string;
  ids?: string[];
}

export class SystemElementTableArgs implements ISystemElementTableArgs {
  name?: string;
  type?: number;
  buildingId?: string;
  /**	地图传来的全量元素 ElementId（已按视频通道权限过滤，含非摄像机元素）	*/
  ids?: string[];
  first = false;
}

export class SystemElementTableFilter implements ISystemElementTableArgs {
  name?: string;
  type?: number;
  buildingId?: string;
  ids?: string[];

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
  alarm: boolean;
  data: T;
}
