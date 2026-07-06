import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { SettingMapElementBuildingBusiness } from './setting-map-element-building.business';
import { SettingMapElementCameraBusiness } from './setting-map-element-camera.business';

export class SettingMapElementBusiness {
  camera: SettingMapElementCameraBusiness;
  building: SettingMapElementBuildingBusiness;
  constructor(private service: GeographicRequestService) {
    this.camera = new SettingMapElementCameraBusiness(service);
    this.building = new SettingMapElementBuildingBusiness(service);
  }

  get(id: string) {
    return this.service.map.element.get(id);
  }
  all() {
    return this.service.map.element.all();
  }
}
