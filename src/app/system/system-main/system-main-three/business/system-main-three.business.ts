import { Injectable } from '@angular/core';
import { ThreeDimensionApiService } from '../../../../common/components/three-dimension/business/services/three-dimension-api.service';
import { ConfigRequestService } from '../../../../common/data-core/request/config/config-request.service';
import { DB31RequestService } from '../../../../common/data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../../../common/data-core/request/services/device/device.service';
import { GeographicRequestService } from '../../../../common/data-core/request/services/geographic/geographic.service';
import { LocalStorage } from '../../../../common/storage/local.storage';
import { SystemMainThreeDeviceBusiness } from './device/system-main-three-device.business';
import { SystemMainThreeConfigBusiness } from './system-main-three-config.business';
import { SystemMainThreeElementBusiness } from './system-main-three-element.business';
import { SystemMainThreeMapBusiness } from './system-main-three-map.business';
import { SystemMainThreeModelBusiness } from './system-main-three-model.business';

@Injectable()
export class SystemMainThreeBusiness {
  constructor(
    geo: GeographicRequestService,
    api: ThreeDimensionApiService,
    config: ConfigRequestService,
    local: LocalStorage,
    device: DeviceRequestService,
    db31: DB31RequestService,
  ) {
    this.map = new SystemMainThreeMapBusiness(geo);
    this.element = new SystemMainThreeElementBusiness(geo, config);
    this.model = new SystemMainThreeModelBusiness(api);
    this.config = new SystemMainThreeConfigBusiness(config, local);
    this.device = new SystemMainThreeDeviceBusiness(device, db31);
  }

  map: SystemMainThreeMapBusiness;
  element: SystemMainThreeElementBusiness;
  model: SystemMainThreeModelBusiness;
  config: SystemMainThreeConfigBusiness;
  device: SystemMainThreeDeviceBusiness;
}
