import { DB31Channel } from '../../../common/data-core/models/db31/db31-channel.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';

export interface SystemDeviceChannelTableArgs {
  db31?: boolean;
  deviceId?: string;
  name?: string;
  state?: number;
}
export interface SystemDeviceChannelTableItem {
  id: string;
  name: string;
  no: string;
  state: {
    name: Promise<string>;
    value?: number;
  };
  canplay: boolean;
  db31: boolean;
  data: VideoChannel | DB31Channel;
}
