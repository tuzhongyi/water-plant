import { GisType } from '../../../common/data-core/enums/gis-type.enum';
import { DB31Channel } from '../../../common/data-core/models/db31/db31-channel.model';
import { GisPoint } from '../../../common/data-core/models/geographic/gis-point.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { DB31RequestService } from '../../../common/data-core/request/services/db31/db31.service';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';
import { TreeDB31DeviceChannel } from '../../../share/tree/tree-device/tree-device.model';

export class SettingMapElementDB31Business {
  constructor(geo: GeographicRequestService, db31: DB31RequestService) {
    this.service = { geo, db31 };
  }

  private service: {
    geo: GeographicRequestService;
    db31: DB31RequestService;
  };

  async state(id: string) {
    try {
      let channel = await this.service.db31.channel.cache.get(id);
      let device = await this.service.db31.device.cache.get(channel.DeviceId);
      return device.DeviceState;
    } catch (error) {
      return 1;
    }
  }

  bind(
    data: DB31Channel,
    location: { x: number; y: number; z: number },
    mapId: string,
    parentId?: string,
  ) {
    let element = this.convert.channel(data, location, mapId, parentId);
    return this.service.geo.map.element.create(element);
  }

  unbind(id: string) {
    return this.service.geo.map.element.delete(id);
  }

  private convert = {
    channel: (
      data: TreeDB31DeviceChannel,
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
