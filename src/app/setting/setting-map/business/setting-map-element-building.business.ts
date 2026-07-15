import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GisType } from '../../../common/data-core/enums/gis-type.enum';
import { GisPoint } from '../../../common/data-core/models/geographic/gis-point.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { MapElementModel } from './setting-map.model';

export class SettingMapElementBuildingBusiness {
  constructor(private service: GeographicRequestService) {}

  async load(): Promise<MapElementModel[]> {
    let params = new GetMapElementsParams();
    params.ElementTypes = [MapElementType.Building];
    let buildings = await this.service.map.element.all(params);

    return buildings;
  }

  floor = {
    load: async (buildingId: string) => {
      let params = new GetMapElementsParams();
      params.ElementTypes = [MapElementType.Floor];
      params.ParentId = buildingId;
      return this.service.map.element.all(params);
    },
    create: (args: {
      buildingId?: string;
      meshname: string;
      mapId: string;
      modelId: string;
      location: { x: number; y: number; z: number };
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

      element.Location = new GisPoint();
      element.Location.Longitude = args.location.x;
      element.Location.Latitude = args.location.z;
      element.Location.Altitude = args.location.y;
      element.Location.GisType = GisType.Other;

      return this.service.map.element.create(element);
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
