import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { LocaleCompare } from '../../../common/tools/compare-tool/compare.tool';
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';
import { MapElementModel } from '../../../setting/setting-map/business/setting-map.model';
import { SystemMainThreeSource } from '../system-main-three.source';
import { SystemMainThreeAlarmBusiness } from './system-main-three-alarm.business';
import { SystemMainThreeArgs } from './system-main-three.model';

export class SystemMainThreeElementBusiness {
  alarm: SystemMainThreeAlarmBusiness;
  constructor(private service: GeographicRequestService) {
    this.alarm = new SystemMainThreeAlarmBusiness(this);
  }

  /** 元素缓存，load 后自动填充 */
  private cache: GeoMapElement[] = [];

  get = {
    by: {
      id: (id: string) => {
        return this.service.map.element.cache.get(id);
      },
      elementId: async (id: string) => {
        let params = new GetMapElementsParams();
        params.ElementIds = [id];
        let array = await this.service.map.element.cache.all(params);
        if (array.length == 1) {
          return array[0];
        } else if (array.length > 1) {
          console.error(`设备ID绑定多个地图元素${id}`, array);
          throw new Error(`设备ID绑定多个地图元素${id}`);
        } else {
          return undefined;
        }
      },
    },
  };

  all() {
    return this.service.map.element.cache.all();
  }
  async load(args: SystemMainThreeArgs, usecache: boolean): Promise<MapElementModel[]> {
    if (args.buildingId) {
      return this.from.building(args.buildingId, args);
    }
    let params = new GetMapElementsParams();
    params.ElementTypes = SystemMainThreeSource.elements;
    params.ParentId = args.floorId;
    params.Name = args.name;
    if (args.type != undefined) {
      params.ElementTypes = [args.type];
    }
    let all: GeoMapElement[];
    if (usecache) {
      all = await this.service.map.element.cache.all(params);
    } else {
      all = await this.service.map.element.all(params);
    }
    if (!args.floorId) {
      all = all.filter((x) => !x.ParentId);
    }

    /* 更新缓存 */
    this.cache = all;

    return all;
  }

  from = {
    /** 通过 deviceId（ElementId）从缓存查找元素 */
    device: (deviceId: string): GeoMapElement | undefined => {
      return this.cache.find((el) => el.ElementId === deviceId);
    },
    building: async (buildingId: string, args?: SystemMainThreeArgs) => {
      let floors = await this.building.floor.load(buildingId);
      let elements: GeoMapElement[] = [];
      for (let i = 0; i < floors.length; i++) {
        const floor = floors[i];
        let _args = new SystemMainThreeArgs();
        if (args) {
          _args = ObjectTool.assign(args, SystemMainThreeArgs);
          _args.buildingId = undefined;
        }
        _args.floorId = floor.Id;
        let datas = await this.load(_args, true);
        elements.push(...datas);
      }
      return elements;
    },
  };

  building = {
    find: async (element: GeoMapElement) => {
      if (element && element.ParentId) {
        let floor = await this.service.map.element.cache.get(element.ParentId);
        if (floor && floor.ParentId) {
          return this.service.map.element.cache.get(floor.ParentId);
        }
      }

      return undefined;
    },
    load: async (): Promise<MapElementModel[]> => {
      let params = new GetMapElementsParams();
      params.ElementTypes = [MapElementType.Building];
      let all = await this.service.map.element.all(params);
      all = all.sort((a, b) => {
        return LocaleCompare.compare(b.Name, a.Name);
      });
      return all;
    },
    floor: {
      load: async (buildingId: string) => {
        let params = new GetMapElementsParams();
        params.ElementTypes = [MapElementType.Floor];
        params.ParentId = buildingId;
        let datas = await this.service.map.element.all(params);
        datas = datas.sort((a, b) => {
          return LocaleCompare.compare(a.Name, b.Name);
        });
        return datas;
      },
    },
  };
}
