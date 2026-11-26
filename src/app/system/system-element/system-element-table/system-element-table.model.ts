import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';

export interface ISystemElementTableArgs {
  name?: string;
  type?: number;
  buildingId?: string;
  ids?: string[];
  /**	0-在线；1-异常（离线 + 报警）；不设置表示全部	*/
  state?: number;
}

export class SystemElementTableArgs implements ISystemElementTableArgs {
  name?: string;
  type?: number;
  buildingId?: string;
  /**	地图传来的全量元素 ElementId（已按视频通道权限过滤，含非摄像机元素）	*/
  ids?: string[];
  state?: number;
  first = false;
}

export class SystemElementTableFilter implements ISystemElementTableArgs {
  name?: string;
  type?: number;
  buildingId?: string;
  ids?: string[];
  state?: number;

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
  /**	是否可以重置状态：离线点位不能复位，避免复位后状态和真实设备对不上 */
  canreset: boolean;
  alarm: boolean;
  data: T;
}

/** 状态查询策略与主业务共享的查询能力 */
export interface SystemElementTableStateQuery {
  /** 构建名称/类型等公共查询参数，state 用于指定在线 0 / 离线 1 / 报警 2 */
  params(filter: SystemElementTableFilter, state?: number): Promise<GetMapElementsParams>;
  /** 应用视频通道权限；false 表示没有可查看元素 */
  permission(params: GetMapElementsParams, filter: SystemElementTableFilter): Promise<boolean>;
  /** 取回后再过滤摄像机通道权限（非摄像机元素保留） */
  filterCameras(datas: GeoMapElement[]): Promise<GeoMapElement[]>;
  /** 建筑下的楼层列表 */
  floors(buildingId: string): Promise<GeoMapElement[]>;
}
