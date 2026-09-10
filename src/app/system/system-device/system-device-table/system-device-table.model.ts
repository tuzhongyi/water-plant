import { KeyValue } from '@angular/common';
import { IDevice } from '../../../common/data-core/models/common/device.interface';
import { DB31Device } from '../../../common/data-core/models/db31/db31-device.model';
import { Device } from '../../../common/data-core/models/devices/device.model';

export interface SystemDeviceTableArgs {
  name?: string;
  type?: KeyValue<boolean, number>;
  state?: number;
  host?: string;
  sn?: string;
}
export interface SystemDeviceTableItem {
  id: string;
  name: string;
  url: string;

  type: {
    name: Promise<string>;
    value: number;
  };

  state: {
    name: Promise<string>;
    value?: number;
  };
  canplay: boolean;
  db31: boolean;
  data: Device | DB31Device;
}
export interface SystemDeviceTableLoad {
  args: SystemDeviceTableArgs;
  extra?: IDevice[];
}
