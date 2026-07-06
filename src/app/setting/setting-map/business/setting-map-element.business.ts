import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { DB31DeviceChannel } from '../../../share/tree/tree-device/tree-device.model';
import { SettingMapElementBuildingBusiness } from './setting-map-element-building.business';
import { SettingMapElementDB31Business } from './setting-map-element-db31.business';
import { SettingMapElementVideoBusiness } from './setting-map-element-video.business';
import { MapElementModel } from './setting-map.model';

export class SettingMapElementBusiness {
  private video: SettingMapElementVideoBusiness;
  private db31: SettingMapElementDB31Business;
  building: SettingMapElementBuildingBusiness;
  constructor(private service: GeographicRequestService) {
    this.video = new SettingMapElementVideoBusiness(service);
    this.db31 = new SettingMapElementDB31Business(service);
    this.building = new SettingMapElementBuildingBusiness(service);
  }

  async load(parentId?: string): Promise<MapElementModel[]> {
    let params = new GetMapElementsParams();
    params.ElementTypes = [
      MapElementType.Camera,
      MapElementType.IoTSensor,
      MapElementType.Announciator,
    ];
    params.ParentId = parentId;
    let all = await this.service.map.element.all(params);
    if (!parentId) {
      return all.filter((x) => !x.ParentId);
    }
    return all;
  }

  async bind(
    data: VideoChannel | DB31DeviceChannel,
    location: { x: number; y: number; z: number },
    mapId: string,
    parentId?: string,
  ) {
    if (data instanceof VideoChannel) {
      return this.video.bind(data, location, mapId, parentId);
    } else if (data instanceof DB31DeviceChannel) {
      return this.db31.bind(data, location, mapId, parentId);
    }
    return undefined;
  }

  unbind(id: string) {
    return this.service.map.element.delete(id);
  }
  get(id: string) {
    return this.service.map.element.get(id);
  }
  all() {
    return this.service.map.element.all();
  }
}
