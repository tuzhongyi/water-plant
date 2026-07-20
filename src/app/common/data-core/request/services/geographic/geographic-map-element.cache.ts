import { GeoMapElement } from '../../../models/geographic/map-element.model';
import { IService } from '../../cache/cache.interface';
import { ServiceCache } from '../../cache/service.cache';
import { GetMapElementsParams } from './geographic.params';

export class GeographicMapElementServiceCache extends ServiceCache<GeoMapElement> {
  constructor(key: string, service: IService<GeoMapElement>) {
    super(key, service, GeoMapElement);
  }

  override filter(datas: GeoMapElement[], params: GetMapElementsParams): GeoMapElement[] {
    if (params.Ids && params.Ids.length > 0) {
      datas = datas.filter((x) => params.Ids!.includes(x.Id));
    }
    if (params.Name) {
      datas = datas.filter((x) => x.Name.includes(params.Name!));
    }
    if (params.ElementTypes && params.ElementTypes.length > 0) {
      datas = datas.filter((x) => params.ElementTypes!.includes(x.ElementType));
    }
    if (params.MapId) {
      datas = datas.filter((x) => x.MapId == params.MapId);
    }
    if (params.ParentId) {
      datas = datas.filter((x) => x.ParentId == params.ParentId);
    }
    if (params.ElementId) {
      datas = datas.filter((x) => x.ElementId == params.ElementId);
    }
    return datas;
  }
}
