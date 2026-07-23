import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GisType } from '../../../common/data-core/enums/gis-type.enum';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GisPoint } from '../../../common/data-core/models/geographic/gis-point.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';

export class SettingMapElementVideoBusiness {
  constructor(private service: GeographicRequestService) {}

  bind(
    data: VideoChannel,
    location: { x: number; y: number; z: number },
    mapId: string,
    parentId?: string,
  ) {
    let element = this.convert.channel(data, location, mapId, parentId);
    return this.service.map.element.create(element);
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
      element.Tags = [JSON.stringify({ DeviceId: data.DeviceId })];
      return element;
    },
  };
}
