import { GisType } from '../../../common/data-core/enums/gis-type.enum';
import { DB31Channel } from '../../../common/data-core/models/db31/db31-channel.model';
import { GisPoint } from '../../../common/data-core/models/geographic/gis-point.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';
import { DB31DeviceChannel } from '../../../share/tree/tree-device/tree-device.model';

export class SettingMapElementDB31Business {
  constructor(private service: GeographicRequestService) {}

  bind(
    data: DB31Channel,
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
      data: DB31DeviceChannel,
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
      element.ElementType = ObjectTool.convert.MapElementType.from.DB31DeviceType(data.DeviceType);
      element.Name = `${data.Name ?? ''}`;
      element.MapId = mapId;
      element.ParentId = parentId;
      element.FromDB31 = true;
      return element;
    },
  };
}
