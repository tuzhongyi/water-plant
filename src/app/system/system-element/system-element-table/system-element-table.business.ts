import { Injectable } from '@angular/core';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { IIdNameModel } from '../../../common/data-core/models/interface/model.interface';
import { PagedList } from '../../../common/data-core/models/interface/page-list.model';
import { DB31RequestService } from '../../../common/data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { ColorTool } from '../../../common/tools/color-tool/color.tool';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import { wait } from '../../../common/tools/wait';
import { SystemMainThreeSource } from '../../system-main-three/system-main-three.source';
import { SystemElementTableFilter, SystemElementTableItem } from './system-element-table.model';

@Injectable()
export class SystemElementTableBusiness {
  constructor(
    device: DeviceRequestService,
    db31: DB31RequestService,
    geo: GeographicRequestService,
    private source: SystemMainThreeSource,
    private language: LanguageTool,
  ) {
    this.service = { device, db31, geo };
  }

  private service: {
    device: DeviceRequestService;
    db31: DB31RequestService;
    geo: GeographicRequestService;
  };

  async load(index: number, size: number, filter: SystemElementTableFilter) {
    let datas = filter.buildingId
      ? await this.get.from.building(index, size, filter.buildingId, filter)
      : await this.get.datas(index, size, filter);

    if (datas.Page.RecordCount == 0 && datas.Page.PageIndex > 1) {
      datas = filter.buildingId
        ? await this.get.from.building(index - 1, size, filter.buildingId, filter)
        : await this.get.datas(index - 1, size, filter);
    }
    let paged = new PagedList<SystemElementTableItem<GeoMapElement>>();
    paged.Page = datas.Page;

    let all = datas.Data.map((x) => this.convert(x));
    paged.Data = await Promise.all(all);

    return paged;
  }

  private async convert(data: GeoMapElement) {
    let item: SystemElementTableItem<GeoMapElement> = {
      id: data.Id,
      name: data.Name,
      type: this.language.geo.ElementType(data.ElementType),
      // binding: this.get.name(data),
      parent: this.get.parent(data.ParentId),
      statename: this.language.geo.ElementStates(data.ElementState),
      statecolor: ColorTool.from.MapElementState(data.ElementState).name,
      canplay: data.ElementType == MapElementType.Camera,
      data: data,
    };
    return item;
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
      return this.service.device.video.channel.get(deviceId, channelId);
    },
    db31: (id: string) => {
      return this.service.db31.device.cache.get(id);
    },
    db31channel: (id: string) => {
      return this.service.db31.channel.get(id);
    },
    datas: async (index: number, size: number, filter: SystemElementTableFilter) => {
      let params = new GetMapElementsParams();
      params.PageIndex = index;
      params.PageSize = size;

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

      return this.service.geo.map.element.list(params);
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

        // 3. 获取所有符合条件的元素，过滤出父级为楼层的数据
        const allElements = await this.service.geo.map.element.cache.array(params);
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
