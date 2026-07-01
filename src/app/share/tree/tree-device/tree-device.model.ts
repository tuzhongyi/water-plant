import { Device } from '../../../common/data-core/models/devices/device.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';

/** @widgetjs/tree 节点格式 */
export interface TreeDeviceNode {
  id: string;
  text: string;
  attributes?: Record<string, any>;
  children?: TreeDeviceNode[];
  check?: boolean;
  data?: Device;
}
export class DeviceNVR extends Device {
  Channels: VideoChannel[] = [];
}
export class DeviceIPC extends Device {
  Channel?: VideoChannel;
}
