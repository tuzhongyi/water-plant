import { DB31RequestService } from '../../../../../common/data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../../../../common/data-core/request/services/device/device.service';
import { SystemMainThreeDeviceDB31Business } from './system-main-three-device-db31.business';
import { SystemMainThreeDeviceVideoBusiness } from './system-main-three-device-video.business';

export class SystemMainThreeDeviceBusiness {
  constructor(device: DeviceRequestService, db31: DB31RequestService) {
    this.db31 = new SystemMainThreeDeviceDB31Business(db31);
    this.video = new SystemMainThreeDeviceVideoBusiness(device);
  }

  db31: SystemMainThreeDeviceDB31Business;
  video: SystemMainThreeDeviceVideoBusiness;
}
