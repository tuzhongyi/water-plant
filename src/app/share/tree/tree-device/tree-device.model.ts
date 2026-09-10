import { NameValue } from '../../../common/data-core/models/capabilities/enum-name-value.model';
import { DB31Channel } from '../../../common/data-core/models/db31/db31-channel.model';
import { DB31Device } from '../../../common/data-core/models/db31/db31-device.model';
import { Device } from '../../../common/data-core/models/devices/device.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { IIdNameModel } from '../../../common/data-core/models/interface/model.interface';

export interface TreeDeviceArgs {
  name?: string;
}

/** @widgetjs/tree 节点格式 */
export interface TreeDeviceNode {
  id: string;
  text: string;
  attributes?: Record<string, any>;
  children?: TreeDeviceNode[];
  check?: boolean;
  data?: Device;
}
export interface ITreeDevice extends IIdNameModel<string, string | undefined> {
  Key: string;
  Icon: string;
  DeviceType: number;
}
export class TreeDeviceNVR extends Device implements ITreeDevice {
  Key: string = '';
  Icon: string = '';
  Channels: VideoChannel[] = [];
}
export class TreeDeviceIPC extends Device implements ITreeDevice {
  Key: string = '';
  Icon: string = '';
  Channel?: VideoChannel;
}
export class TreeDeviceDB31 extends DB31Device implements ITreeDevice {
  Key: string = '';
  Icon: string = '';
  Channels: TreeDB31DeviceChannel[] = [];
}
export class TreeDB31DeviceChannel extends DB31Channel {
  DeviceName?: string;
}
export class KeyNameValue<T = number> extends NameValue<T> {
  Key: string = '';
}
