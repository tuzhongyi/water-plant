import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { MapModel } from '../../../setting/setting-map/business/setting-map.model';

export class SystemMainThreeMapBusiness {
  constructor(private service: GeographicRequestService) {}

  async load(): Promise<MapModel | undefined> {
    let maps = await this.service.map.array();
    if (maps.length > 0) {
      return maps[0];
    }
    return undefined;
  }
}
