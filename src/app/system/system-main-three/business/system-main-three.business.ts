import { Injectable } from '@angular/core';
import { ThreeDimensionApiService } from '../../../common/components/three-dimension/business/services/three-dimension-api.service';
import { ConfigRequestService } from '../../../common/data-core/request/config/config-request.service';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { LocalStorage } from '../../../common/storage/local.storage';
import { SystemMainThreeConfigBusiness } from './system-main-three-config.business';
import { SystemMainThreeElementBusiness } from './system-main-three-element.business';
import { SystemMainThreeMapBusiness } from './system-main-three-map.business';
import { SystemMainThreeModelBusiness } from './system-main-three-model.business';

@Injectable()
export class SystemMainThreeBusiness {
  constructor(
    service: GeographicRequestService,
    api: ThreeDimensionApiService,
    config: ConfigRequestService,
    local: LocalStorage,
  ) {
    this.map = new SystemMainThreeMapBusiness(service);
    this.element = new SystemMainThreeElementBusiness(service);
    this.model = new SystemMainThreeModelBusiness(api);
    this.config = new SystemMainThreeConfigBusiness(config, local);
  }

  map: SystemMainThreeMapBusiness;

  element: SystemMainThreeElementBusiness;

  model: SystemMainThreeModelBusiness;
  config: SystemMainThreeConfigBusiness;
}
