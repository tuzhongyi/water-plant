import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GisType } from '../../../common/data-core/enums/gis-type.enum';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GisPoint } from '../../../common/data-core/models/geographic/gis-point.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { MapElementModel } from './setting-map.model';

export class SettingMapElementCameraBusiness {
  constructor(private service: GeographicRequestService) {}

  async load(parentId?: string): Promise<MapElementModel[]> {
    let params = new GetMapElementsParams();
    params.ElementTypes = [MapElementType.Camera];
    params.ParentId = parentId;
    let all = await this.service.map.element.all(params);
    if (!parentId) {
      return all.filter((x) => !x.ParentId);
    }
    return all;
  }

  bind(
    data: VideoChannel,
    location: { x: number; y: number; z: number },
    mapId: string,
    parentId?: string,
  ) {
    let element = this.convert.channel(data, location, mapId, parentId);
    return this.service.map.element.create(element);
  }

  unbind(id: string) {
    return this.service.map.element.delete(id);
  }

  private convert = {
    channel: (
      data: VideoChannel,
      location: { x: number; y: number; z: number },
      mapId: string,
      parentId?: string,
    ): GeoMapElement => {
      let element = new GeoMapElement();
      element.Location = new GisPoint();
      element.Location.Longitude = location.x;
      element.Location.Latitude = location.z;
      element.Location.Altitude = location.y;
      element.Location.GisType = GisType.Other;

      element.Id = '';
      element.CreateTime = new Date();
      element.UpdateTime = new Date();

      element.ElementId = data.Id;
      element.ElementType = MapElementType.Camera;
      element.Name = data.Name;
      element.MapId = mapId;
      element.ParentId = parentId;
      return element;
    },
  };
}
