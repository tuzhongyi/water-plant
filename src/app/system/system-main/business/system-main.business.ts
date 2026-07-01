import { Injectable } from '@angular/core';
import { SystemMainDB31Business } from './system-main-db31.business';
import { SystemMainDeviceBusiness } from './system-main-device.business';
import { SystemMainVideoChannelBusiness } from './system-main-video-channel.business';

@Injectable()
export class SystemMainBusiness {
  constructor(
    public device: SystemMainDeviceBusiness,
    public db31: SystemMainDB31Business,
  ) {}
}
export const SystemMainDeviceBusinessProviders = [
  SystemMainDeviceBusiness,
  SystemMainVideoChannelBusiness,
  SystemMainDB31Business,
  SystemMainBusiness,
];
