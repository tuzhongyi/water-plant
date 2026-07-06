import { Injectable } from '@angular/core';
import { DB31Device } from '../../../common/data-core/models/db31/db31-device.model';
import { Device } from '../../../common/data-core/models/devices/device.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GetDB31DeviceChannelsParams } from '../../../common/data-core/request/services/db31/db31.params';
import { DB31RequestService } from '../../../common/data-core/request/services/db31/db31.service';
import { GetVideoChannelsParams } from '../../../common/data-core/request/services/device/device.params';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';
import { ArrayTool } from '../../../common/tools/array-tool/array.tool';
import { IconTool } from '../../../common/tools/icon-tool/icon.tool';
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';
import {
  DB31DeviceChannel,
  DeviceDB31,
  DeviceIPC,
  DeviceNVR,
  IDevice,
  KeyNameValue,
} from './tree-device.model';

@Injectable()
export class TreeDeviceBusiness {
  constructor(device: DeviceRequestService, db31: DB31RequestService) {
    this.service = { device, db31 };
  }

  private key = {
    device: 'device_',
    db31: 'db31_',
  };
  private service: {
    device: DeviceRequestService;
    db31: DB31RequestService;
  };

  types() {
    return this.data.types;
  }

  async load(): Promise<Record<string, IDevice[]>> {
    const [types, deviceDatas, db31Datas] = await Promise.all([
      this.data.types(),
      this.data.device.load(),
      this.data.db31.load(),
    ]);
    /* 转换设备数据 */
    const converted = await Promise.all(deviceDatas.map((d) => this.convert(d)));
    const convertedDb31 = await Promise.all(db31Datas.map((d) => this.convert(d)));
    const deviceGrouped = ArrayTool.groupBy(converted, (x) => x.DeviceType);
    const db31Grouped = ArrayTool.groupBy(convertedDb31, (x) => x.DeviceType);
    const result: Record<string, IDevice[]> = {};
    for (const t of types) {
      if (t.Key.startsWith(this.key.device)) {
        result[t.Key] = deviceGrouped[t.Value] ?? [];
      } else if (t.Key.startsWith(this.key.db31)) {
        result[t.Key] = db31Grouped[t.Value] ?? [];
      }
    }
    return result;
  }

  private async convert(data: Device | DB31Device): Promise<IDevice> {
    if (data instanceof Device) {
      let channels: VideoChannel[] = [];
      try {
        channels = await this.data.device.channels(data.Id);
      } catch (error) {}

      switch (data.DeviceType) {
        case 1:
          let ipc = ObjectTool.assign(data, DeviceIPC);
          if (channels.length > 0) {
            ipc.Channel = channels[0];
            ipc.Icon = IconTool.DeviceType(ipc.DeviceType);
            ipc.Key = `${this.key.device}${ipc.DeviceType}`;
          }
          return ipc;
        case 2:
          let nvr = ObjectTool.assign(data, DeviceNVR);
          nvr.Key = `${this.key.device}${nvr.DeviceType}`;
          nvr.Icon = IconTool.DeviceType(nvr.DeviceType);
          nvr.Channels = [...channels];
          return nvr;

        default:
          throw new Error('未知设备类型');
      }
    } else {
      let channels: DB31DeviceChannel[] = [];
      try {
        channels = await this.data.db31.channels(data);
      } catch (error) {}

      let db31 = ObjectTool.assign(data, DeviceDB31);
      db31.Key = `${this.key.db31}${db31.DeviceType}`;
      db31.Icon = IconTool.DeviceType(db31.DeviceType, true);
      db31.Channels = [...channels];
      return db31;
    }
  }

  private data = {
    types: async (): Promise<KeyNameValue[]> => {
      let device = (await this.service.device.capability()).DeviceTypes ?? [];
      let db31 = (await this.service.db31.capability()).DeviceTypes ?? [];

      return [
        ...device.map((x) => ({
          Key: `${this.key.device}${x.Value}`,
          Value: x.Value,
          Name: x.Name,
        })),
        ...db31.map((x) => ({
          Key: `${this.key.db31}${x.Value}`,
          Value: x.Value,
          Name: x.Name,
        })),
      ];
    },
    device: {
      load: () => {
        return this.service.device.all();
      },
      channels: (deviceId: string) => {
        let params = new GetVideoChannelsParams();
        params.DeviceId = deviceId;
        return this.service.device.video.channel.all(params);
      },
    },
    db31: {
      load: () => {
        return this.service.db31.device.all();
      },
      channels: async (device: DB31Device) => {
        let params = new GetDB31DeviceChannelsParams();
        params.DeviceId = device.Id;
        let channels = await this.service.db31.channel.all(params);
        return channels.map((x) => {
          let channel = ObjectTool.assign(x, DB31DeviceChannel);
          channel.DeviceName = device.Name;
          return channel;
        });
      },
    },
  };
}
