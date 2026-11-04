import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GisType } from '../../../common/data-core/enums/gis-type.enum';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GisPoint } from '../../../common/data-core/models/geographic/gis-point.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';

export class SettingMapElementVideoBusiness {
  constructor(geo: GeographicRequestService, device: DeviceRequestService) {
    this.service = { geo, device };
  }

  private service: {
    geo: GeographicRequestService;
    device: DeviceRequestService;
  };

  async get(id: string) {
    return this.service.device.video.channel.cache.get(id);
  }
  /**	通道状态：0-在线，1-离线
      查不到通道时返回 undefined，由调用方判断设备是否存在，不能直接判为离线 */
  async state(id: string): Promise<number | undefined> {
    try {
      let channel = await this.get(id);
      return channel.ChannelState;
    } catch (error) {
      return undefined;
    }
  }

  bind(
    data: VideoChannel,
    location: { x: number; y: number; z: number },
    mapId: string,
    parentId?: string,
  ) {
    let element = this.convert.channel(data, location, mapId, parentId);
    return this.service.geo.map.element.create(element);
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
