import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GisType } from '../../../common/data-core/enums/gis-type.enum';
import { GisPoint } from '../../../common/data-core/models/geographic/gis-point.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { LocaleCompare } from '../../../common/tools/compare-tool/compare.tool';
import { MapElementModel } from './setting-map.model';

export class SettingMapElementBuildingBusiness {
  private cache: MapElementModel[] = [];

  constructor(private service: GeographicRequestService) {}

  async load(): Promise<MapElementModel[]> {
    let datas = await this.all();
    datas = datas.filter((x) => x.ElementType === MapElementType.Building);
    return datas;
  }

  private async all(): Promise<GeoMapElement[]> {
    if (this.cache.length > 0) return this.cache;

    let params = new GetMapElementsParams();
    params.ElementTypes = [MapElementType.Building, MapElementType.Floor];
    let datas = await this.service.map.element.all(params);
    this.cache = datas;
    return datas;
  }

  async create(args: {
    mapId: string;
    modelId: string;
    name: string;
    expansion?: string;
    location?: { x: number; y: number; z: number };
  }): Promise<GeoMapElement> {
    let element = new GeoMapElement();
    element.Id = '';
    element.CreateTime = new Date();
    element.UpdateTime = new Date();
    element.ElementType = MapElementType.Building;

    element.Name = args.name;
    element.MapId = args.mapId;
    element.ElementId = args.modelId;
    element.Tags = args.expansion ? [args.expansion] : [];

    if (args.location) {
      element.Location = new GisPoint();
      element.Location.Longitude = args.location.x;
      element.Location.Latitude = args.location.z;
      element.Location.Altitude = args.location.y;
      element.Location.GisType = GisType.Other;
    }

    let result = await this.service.map.element.create(element);
    if (this.cache) {
      this.cache.push(result as MapElementModel);
    }
    return result;
  }

  floor = {
    load: async (buildingId: string) => {
      await this.all();
      return this.cache!.filter(
        (x) => x.ElementType === MapElementType.Floor && x.ParentId === buildingId,
      ).sort((a, b) => {
        return LocaleCompare.compare(a.Name, b.Name);
      });
    },
    create: async (args: {
      buildingId?: string;
      meshname: string;
      mapId: string;
      modelId: string;
      location?: { x: number; y: number; z: number };
    }) => {
      let element = new GeoMapElement();
      element.Id = '';
      element.CreateTime = new Date();
      element.UpdateTime = new Date();
      element.ElementType = MapElementType.Floor;

      element.Name = this.convert.name(args.meshname);
      element.MapId = args.mapId;
      element.ElementId = args.meshname;
      element.ParentId = args.buildingId;
      element.Tags = [args.modelId];

      if (args.location) {
        element.Location = new GisPoint();
        element.Location.Longitude = args.location.x;
        element.Location.Latitude = args.location.z;
        element.Location.Altitude = args.location.y;
        element.Location.GisType = GisType.Other;
      }

      let result = await this.service.map.element.create(element);
      if (this.cache) {
        this.cache.push(result as MapElementModel);
      }
      return result;
    },
  };

  private convert = {
    /** Roof => FR, Floor{N} => F{N}, Basement{N} => B{N} */
    name: (value: string) => {
      if (value === 'Roof') return 'FR';
      const floor = /^Floor(\d+)$/.exec(value);
      if (floor) return `F${floor[1]}`;
      const basement = /^Basement(\d+)$/.exec(value);
      if (basement) return `B${basement[1]}`;
      return value;
    },
    position: () => {},
  };
}
