import { Injectable } from '@angular/core';
import { IDevice } from '../../../common/data-core/models/common/device.interface';
import { DB31Device } from '../../../common/data-core/models/db31/db31-device.model';
import { Device } from '../../../common/data-core/models/devices/device.model';
import { PagedList } from '../../../common/data-core/models/interface/page-list.model';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import { SystemDeviceTableArgs, SystemDeviceTableItem } from './system-device-table.model';

@Injectable()
export class SystemDeviceTableBusiness {
  constructor(private language: LanguageTool) {}
  async load(
    index: number,
    size: number,
    args: SystemDeviceTableArgs,
    source: IDevice[],
    extra: IDevice[],
  ) {
    let datas = source.map((x) => this.convert.to(x));
    datas = this.filter(datas, args);
    let extras = extra.map((x) => this.convert.to(x));
    let merged = this.merge(datas, extras);
    let paged = PagedList.create(merged, index, size);

    return paged;
  }

  private merge(datas: SystemDeviceTableItem[], extras: SystemDeviceTableItem[]) {
    let ids = new Set(datas.map((x) => x.id));
    let result = [...datas];
    for (let item of extras) {
      if (!ids.has(item.id)) {
        ids.add(item.id);
        result.push(item);
      }
    }
    return result;
  }

  private filter(source: SystemDeviceTableItem[], args: SystemDeviceTableArgs) {
    let datas = [...source];
    if (args.name) {
      datas = datas.filter((x) => x.name.toLowerCase().includes(args.name!.toLowerCase()));
    }
    if (args.host) {
      datas = datas.filter((x) => x.url.toLowerCase().includes(args.host!.toLowerCase()));
    }

    if (args.state != undefined) {
      datas = datas.filter((x) => x.state.value == args.state);
    }
    if (args.type != undefined) {
      datas = datas.filter((x) => {
        return x.db31 == args.type!.key && x.type.value == args.type!.value;
      });
    }
    return datas;
  }

  private convert = {
    to: (data: IDevice) => {
      if (data instanceof Device) {
        return this.convert.from.device(data);
      } else {
        return this.convert.from.db31(data as DB31Device);
      }
    },
    from: {
      device: (data: Device) => {
        let item: SystemDeviceTableItem = {
          id: data.Id,
          name: data.Name,
          url: `${data.Host}:${data.Port}`,
          type: {
            value: data.DeviceType,
            name: this.language.device.DeviceType(data.DeviceType),
          },
          data: data,
          state: {
            value: data.DeviceState,
            name: this.language.device.DeviceState(data.DeviceState),
          },
          db31: false,
          canplay: data.DeviceType == 1,
        };
        return item;
      },
      db31: (data: DB31Device) => {
        let item: SystemDeviceTableItem = {
          id: data.Id,
          name: data.Name ?? '-',
          url: `${data.HostUrl}`,
          type: {
            value: data.DeviceType,
            name: this.language.db31.DeviceType(data.DeviceType),
          },
          data: data,
          state: {
            value: data.DeviceState,
            name: this.language.db31.DeviceState(data.DeviceState),
          },
          db31: true,
          canplay: false,
        };
        return item;
      },
    },
  };
}
