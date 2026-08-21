import { Injectable } from '@angular/core';
import { SystemMainDB31Business } from './system-main-db31.business';
import { SystemMainDeviceBusiness } from './system-main-device.business';
import { SystemMainElementBusiness } from './system-main-element.business';
import { SystemMainVideoChannelBusiness } from './system-main-video-channel.business';

@Injectable()
export class SystemMainBusiness {
  constructor(
    public device: SystemMainDeviceBusiness,
    public db31: SystemMainDB31Business,
    public element: SystemMainElementBusiness,
  ) {}
}
export const SystemMainDeviceBusinessProviders = [
  SystemMainElementBusiness,
  SystemMainDeviceBusiness,
  SystemMainVideoChannelBusiness,
  SystemMainDB31Business,
  SystemMainBusiness,
];
