import { Injectable } from '@angular/core';
import { Device } from '../../../common/data-core/models/devices/device.model';
import { GetVideoChannelsParams } from '../../../common/data-core/request/services/device/device.params';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';
import { ArrayTool } from '../../../common/tools/array-tool/array.tool';
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';
import { DeviceIPC, DeviceNVR } from './tree-device.model';

@Injectable()
export class TreeDeviceBusiness {
  constructor(private service: DeviceRequestService) {}

  async load(): Promise<Record<number, Device[]>> {
    const [types, datas] = await Promise.all([this.data.types(), this.data.devices()]);
    /* 转换设备数据 */
    const converted = await Promise.all(datas.map((d) => this.convert(d).catch(() => d)));
    const grouped = ArrayTool.groupBy(converted, (x) => x.DeviceType);
    const result: Record<number, Device[]> = {};
    for (const t of types) {
      result[t.Value] = grouped[t.Value] ?? [];
    }
    return result;
  }

  private async convert(data: Device) {
    let channels = await this.data.channels(data.Id);
    switch (data.DeviceType) {
      case 1:
        let ipc = ObjectTool.assign(data, DeviceIPC);
        if (channels.length > 0) {
          ipc.Channel = channels[0];
        }
        return ipc;
      case 2:
        let nvr = ObjectTool.assign(data, DeviceNVR);
        nvr.Channels = [...channels];
        return nvr;

      default:
        throw new Error('未知设备类型');
    }
  }

  private data = {
    types: async () => {
      let capability = await this.service.capability();
      return capability.DeviceTypes ?? [];
    },
    devices: () => {
      return this.service.all();
    },
    channels: (deviceId: string) => {
      let params = new GetVideoChannelsParams();
      params.DeviceId = deviceId;
      return this.service.video.channel.all(params);
    },
  };
}
