import { Injectable } from '@angular/core';

import { DB31Channel } from '../../../common/data-core/models/db31/db31-channel.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GetDB31DeviceChannelsParams } from '../../../common/data-core/request/services/db31/db31.params';
import { DB31RequestService } from '../../../common/data-core/request/services/db31/db31.service';
import { GetVideoChannelsParams } from '../../../common/data-core/request/services/device/device.params';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import {
  SystemDeviceChannelTableArgs,
  SystemDeviceChannelTableItem,
} from './system-device-channel-table.model';

@Injectable()
export class SystemDeviceChannelTableBusiness {
  constructor(
    private device: DeviceRequestService,
    private db31: DB31RequestService,
    private language: LanguageTool,
  ) {}

  load(args: SystemDeviceChannelTableArgs) {
    if (args.db31) {
      return this.from.db31(args);
    }
    return this.from.device(args);
  }

  private from = {
    device: async (args: SystemDeviceChannelTableArgs) => {
      let params = new GetVideoChannelsParams();

      params.DeviceId = args.deviceId;
      params.Name = args.name;
      if (args.state != undefined) {
        params.ChannelState = args.state;
      }

      let datas = await this.device.video.channel.all(params);
      return datas.map((x) => this.convert.device(x));
    },
    db31: async (args: SystemDeviceChannelTableArgs) => {
      let params = new GetDB31DeviceChannelsParams();
      params.DeviceId = args.deviceId;
      params.Name = args.name;
      let datas = await this.db31.channel.all(params);
      return datas.map((data) => this.convert.db31(data));
    },
  };

  private convert = {
    device: (data: VideoChannel): SystemDeviceChannelTableItem => {
      return {
        id: data.Id,
        name: data.Name ?? '-',
        no: `${data.ChannelNo}`,
        state: {
          value: data.ChannelState,
          name: this.language.device.DeviceState(data.ChannelState),
        },
        canplay: data.Enabled && data.ChannelState == 0,
        db31: false,
        data,
      };
    },
    db31: (data: DB31Channel): SystemDeviceChannelTableItem => {
      return {
        id: data.Id,
        name: data.Name ?? '-',
        no: data.ChannelNo,
        state: { value: undefined, name: Promise.resolve('-') },
        canplay: false,
        db31: true,
        data,
      };
    },
  };

  private channelState(value?: number) {
    if (value === 0) return '正常';
    if (value === 1) return '离线';
    return '-';
  }
}
