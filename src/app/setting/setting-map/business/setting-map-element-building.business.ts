import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { MapElementModel } from './setting-map.model';

export class SettingMapElementBuildingBusiness {
  constructor(private service: GeographicRequestService) {}

  async load(): Promise<MapElementModel[]> {
    let params = new GetMapElementsParams();
    params.ElementTypes = [MapElementType.Building];
    return this.service.map.element.all(params);
  }

  floor = {
    load: async (buildingId: string) => {
      let params = new GetMapElementsParams();
      params.ElementTypes = [MapElementType.Floor];
      params.ParentId = buildingId;
      return this.service.map.element.all(params);
    },
  };
}
