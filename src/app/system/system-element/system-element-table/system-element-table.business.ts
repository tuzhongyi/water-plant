import { Injectable } from '@angular/core';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { IIdNameModel } from '../../../common/data-core/models/interface/model.interface';
import { Page, PagedList } from '../../../common/data-core/models/interface/page-list.model';
import { DB31RequestService } from '../../../common/data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { GlobalStorage } from '../../../common/storage/global.storage';
import { ElementStateTool } from '../../../common/tools/element-state-tool/element-state.tool';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import { PermissionTool } from '../../../common/tools/permission-tool/permission.tool';
import { wait } from '../../../common/tools/wait';
import { SystemMainThreeSource } from '../../system-main/system-main-three/system-main-three.source';
import { SystemElementTableAbnormalBusiness } from './system-element-table-abnormal.business';
import {
  SystemElementTableFilter,
  SystemElementTableItem,
  SystemElementTableStateQuery,
} from './system-element-table.model';
import { SystemElementTableOnlineBusiness } from './system-element-table-online.business';

@Injectable()
export class SystemElementTableBusiness {
  constructor(
    device: DeviceRequestService,
    db31: DB31RequestService,
    geo: GeographicRequestService,
    private source: SystemMainThreeSource,
    private language: LanguageTool,
    private permission: PermissionTool,
    private elementstate: ElementStateTool,
    private global: GlobalStorage,
  ) {
    this.service = { device, db31, geo };
    this.online = new SystemElementTableOnlineBusiness(geo);
    this.abnormal = new SystemElementTableAbnormalBusiness(geo);
  }

  /** 在线 / 异常两种状态的具体查询逻辑 */
  private online: SystemElementTableOnlineBusiness;
  private abnormal: SystemElementTableAbnormalBusiness;

  /** 两种状态查询共用的参数、权限过滤能力 */
  private query: SystemElementTableStateQuery = {
    params: (filter, state) => this.createParams(filter, state),
    permission: (params, filter) => this.applyPermission(params, filter),
    filterCameras: (datas) => this.filterCameras(datas),
    floors: (buildingId) => this.get.floors(buildingId),
  };

  private service: {
    device: DeviceRequestService;
    db31: DB31RequestService;
    geo: GeographicRequestService;
  };

  async load(index: number, size: number, filter: SystemElementTableFilter) {
    /* 摄像机行的预览按钮要按通道权限判断，先把用户权限准备好 */
    await this.permission.load().catch(() => {});
    /*	状态只分在线（0）和异常（非 0）：异常由 abnormal 业务分别取离线和报警后合并分页 */
    let abnormal = filter.state !== undefined && filter.state !== 0;
    let online = filter.state === 0;
    const load = async (page: number) => {
      if (filter.buildingId) {
        if (abnormal) {
          return this.abnormal.building(page, size, filter.buildingId, filter, this.query);
        }
        if (online) {
          return this.online.building(page, size, filter.buildingId, filter, this.query);
        }
        return this.get.from.building(page, size, filter.buildingId, filter);
      }
      if (abnormal) {
        return this.abnormal.load(page, size, filter, this.query);
      }
      if (online) {
        return this.online.load(page, size, filter, this.query);
      }
      return this.get.datas(page, size, filter);
    };
    let datas = await load(index);
    if (datas.Page.RecordCount == 0 && datas.Page.PageIndex > 1) {
      datas = await load(datas.Page.PageIndex - 1);
    }
    let paged = new PagedList<SystemElementTableItem<GeoMapElement>>();
    paged.Page = datas.Page;

    let all = datas.Data.map((x) => this.convert(x));
    paged.Data = await Promise.all(all);

    return paged;
  }

  private async convert(data: GeoMapElement) {
    /*	状态口径与场景 marker / 统计面板一致（统一走 ElementStateTool）：
        DB31 元素取不到 ElementState 时按父设备状态，其他没有状态的按离线显示 */
    let state = await this.elementstate.state(data);
    /*	表格状态只分在线和异常：报警和离线统一显示为异常 */
    let online = state === 0;
    let item: SystemElementTableItem<GeoMapElement> = {
      id: data.Id,
      name: data.Name,
      type: this.language.geo.ElementType(data.ElementType),
      // binding: this.get.name(data),
      parent: this.get.parent(data.ParentId),
      statename: Promise.resolve(online ? '在线' : '异常'),
      statecolor: online ? 'green' : 'redlight',
      /*	按解析后的状态判断：摄像机没有 ElementState 时 ElementStateTool 会查视频通道，
          通道在线同样可以预览 */
      canplay:
        data.ElementType == MapElementType.Camera &&
        this.permission.canChannel(data.ElementId) &&
        state == 0,
      /*	离线点位不能复位：复位只会清报警，处理不了设备离线，容易出现状态不一致 */
      canreset: state !== 1,

      alarm: true,
      data: data,
    };
    return item;
  }

  /**	当前用户可查看的视频通道 Id；undefined 表示不受通道限制（根用户）。
      非根用户通道没加载成功时按没有可查看通道处理，与 PermissionTool 口径一致 */
  private async allowedChannels(): Promise<string[] | undefined> {
    await this.permission.load().catch(() => {});
    if (this.permission.isRoot) {
      return undefined;
    }
    if (!this.global.user.channels.existed) {
      return [];
    }
    let channels = await this.global.user.channels.get();
    return (channels ?? []).map((x) => x.Id);
  }

  /**	权限过滤参数：
      优先用地图传来的全量 ElementId（含报警器/传感器/出入口，已按通道权限过滤过），
      直接交给服务端，分页总数准确，也不会误伤非摄像机元素；
      地图还没拿到数据时退回按通道过滤（见 applyChannels）。
      返回 false 表示没有任何可查看元素，调用方直接返回空数据 */
  private async applyPermission(
    params: GetMapElementsParams,
    filter: SystemElementTableFilter,
  ): Promise<boolean> {
    await this.permission.load().catch(() => {});
    if (!this.permission.isRoot && filter.ids && filter.ids.length > 0) {
      params.ElementIds = filter.ids;
      return true;
    }
    return this.applyChannels(params);
  }

  /**	查询类型只有摄像机时，让服务端按 ElementIds 过滤通道：
      这样分页总数才是权限过滤后的数量。
      返回 false 表示没有任何可查看通道，调用方直接返回空数据——
      不能传空数组，部分后端会把空 ElementIds 当成“不过滤” */
  private async applyChannels(params: GetMapElementsParams): Promise<boolean> {
    let types = params.ElementTypes ?? [];
    if (types.length != 1 || types[0] != MapElementType.Camera) {
      return true;
    }
    let channels = await this.allowedChannels();
    if (channels === undefined) {
      return true;
    }
    if (channels.length == 0) {
      return false;
    }
    params.ElementIds = channels;
    return true;
  }

  /**	取回后只过滤摄像机：类型里混有报警器/传感器/出入口时不能整体传 ElementIds
      （它们的 ElementId 不是视频通道，会被一起过滤掉），这里只判断摄像机的通道权限，
      其他元素原样保留 */
  private async filterCameras(datas: GeoMapElement[]): Promise<GeoMapElement[]> {
    await this.permission.load().catch(() => {});
    if (this.permission.isRoot) {
      return datas;
    }
    if (!datas.some((x) => x.ElementType == MapElementType.Camera)) {
      return datas;
    }
    return datas.filter((x) => {
      return x.ElementType != MapElementType.Camera || this.permission.canChannel(x.ElementId);
    });
  }

  /**	构建名称/类型等公共查询参数；state 由在线/异常业务指定 */
  private async createParams(
    filter: SystemElementTableFilter,
    state?: number,
  ): Promise<GetMapElementsParams> {
    let params = new GetMapElementsParams();
    if (filter.name) {
      params.Name = filter.name;
    }
    if (filter.type !== undefined) {
      params.ElementTypes = [filter.type];
    } else {
      await wait(() => {
        return this.source.loaded;
      });
      params.ElementTypes = this.source.type.elements.map((x) => x.Value);
    }
    if (state !== undefined) {
      params.ElementState = state;
    }
    return params;
  }

  private get = {
    state: () => {},
    parent: async (parentId?: string): Promise<string> => {
      if (!parentId) return '';
      let current = await this.service.geo.map.element.get(parentId);
      /* 逐级向上查找：Floor 的父级是 Building，中间可能有其他层级 */
      const parts: string[] = [];
      while (current) {
        if (current.ElementType === MapElementType.Building) {
          parts.unshift(current.Name);
          break;
        }
        if (current.ElementType === MapElementType.Floor) {
          parts.unshift(current.Name);
        }
        if (!current.ParentId) break;
        current = await this.service.geo.map.element.get(current.ParentId);
      }
      return parts.join(' - ');
    },
    name: async (data: GeoMapElement) => {
      if (!data.ElementId) return '';
      let device: IIdNameModel<string, string | undefined>;
      if (data.FromDB31) {
        try {
          device = await this.get.db31channel(data.ElementId);
        } catch (e) {
          device = await this.get.db31(data.ElementId);
        }
      } else {
        if (data.Tags && data.Tags.length > 0) {
          try {
            let obj = JSON.parse(data.Tags[0]);
            device = await this.get.videochannel(obj.DeviceId, data.ElementId);
          } catch (error) {
            device = await this.get.device(data.ElementId);
          }
        } else {
          device = await this.get.device(data.ElementId);
        }
      }
      return device.Name ?? '';
    },

    device: (id: string) => {
      return this.service.device.cache.get(id);
    },
    videochannel: (deviceId: string, channelId: string) => {
      return this.service.device.video.channel.cache.get(channelId);
    },
    db31: (id: string) => {
      return this.service.db31.device.cache.get(id);
    },
    db31channel: (id: string) => {
      return this.service.db31.channel.get(id);
    },
    datas: async (index: number, size: number, filter: SystemElementTableFilter) => {
      let params = await this.createParams(filter, filter.state);
      params.PageIndex = index;
      params.PageSize = size;

      if (!(await this.applyPermission(params, filter))) {
        let paged = new PagedList<GeoMapElement>();
        paged.Page = Page.create(index, size, 0);
        paged.Data = [];
        return paged;
      }

      let datas = await this.service.geo.map.element.list(params);
      datas.Data = await this.filterCameras(datas.Data);
      return datas;
    },

    floors: (buildingId: string) => {
      let params = new GetMapElementsParams();
      params.ElementTypes = [MapElementType.Floor];
      params.ParentId = buildingId;
      return this.service.geo.map.element.cache.all(params);
    },
    from: {
      floor: async (buildingId: string, filter: SystemElementTableFilter) => {
        // 1. 查找建筑物下所有楼层
        const floors = await this.get.floors(buildingId);
        const floorIds = new Set(floors.map((f) => f.Id));

        // 2. 构建除 buildingId 外的筛选参数
        let params = await this.createParams(filter, filter.state);

        if (!(await this.applyPermission(params, filter))) {
          return [];
        }

        // 3. 获取所有符合条件的元素，过滤出父级为楼层的数据
        const allElements = await this.filterCameras(
          await this.service.geo.map.element.all(params),
        );
        return allElements.filter((x) => x.ParentId && floorIds.has(x.ParentId));
      },
      building: async (
        index: number,
        size: number,
        buildingId: string,
        filter: SystemElementTableFilter,
      ) => {
        const elements = await this.get.from.floor(buildingId, filter);
        return PagedList.create(elements, index, size);
      },
    },
  };
}
