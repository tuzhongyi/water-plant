import { Injectable } from '@angular/core';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { DeviceEventResource } from '../../../common/data-core/models/events/device-event-resource.model';
import { DB31RequestService } from '../../../common/data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';
import { GetDeviceEventRecordsParams } from '../../../common/data-core/request/services/event/event.params';
import { EventRequestService } from '../../../common/data-core/request/services/event/event.service';
import { CapabilityTool } from '../../../common/tools/capability-tool/capability.tool';
import { DateTimeTool } from '../../../common/tools/date-time-tool/datetime.tool';
import { IconTool } from '../../../common/tools/icon-tool/icon.tool';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import {
  SystemMainRecordTableArgs,
  SystemMainRecordTableEventType,
  SystemMainRecordTableItem,
} from './system-main-record-table.model';

@Injectable()
export class SystemMainRecordTableBusiness {
  constructor(
    event: EventRequestService,
    device: DeviceRequestService,
    db31: DB31RequestService,
    private capability: CapabilityTool,
    private language: LanguageTool,
  ) {
    this.service = { event, device, db31 };
  }

  private service: {
    event: EventRequestService;
    device: DeviceRequestService;
    db31: DB31RequestService;
  };

  async load(args: SystemMainRecordTableArgs) {
    let duration = DateTimeTool.last.month(new Date());
    let params = new GetDeviceEventRecordsParams();
    params.BeginTime = duration.begin;
    params.EndTime = duration.end;
    params.PageIndex = 1;
    params.PageSize = 100;
    params.Desc = 'EventTime';
    if (args.type) {
      params.EventTypes = await this.types(args.type);
    }

    let paged = await this.service.event.record.list(params);
    let all = paged.Data.map((x) => this.convert(x));
    return Promise.all(all);
  }

  private async convert(data: DeviceEventRecord) {
    let icon = IconTool.DeviceEventResource(data.Resource?.ResourceType);
    if (!icon && data.DeviceId) {
      icon = await this.get.icon(data.DeviceId, data.FromDB31);
    }
    let name = this.get.name(data);
    let item: SystemMainRecordTableItem = {
      id: data.Id,
      time: data.EventTime,
      name: name,
      description: `${name}\n${data.Description}`,
      color: this.get.color(data.EventType),
      icon: icon,
      type: await this.language.event.EventTypes(data.EventType),
      playback: this.get.playback(data),
      data: data,
    };
    return item;
  }

  get = {
    playback: (data: DeviceEventRecord) => {
      switch (data.EventType) {
        case 1:
        case 2:
          return true;

        default:
          return !!data.Actions && data.Actions.length > 0;
      }
    },
    name: (data: DeviceEventRecord) => {
      let name = data.DeviceName || '';
      if (data.Resource) {
        if (data.Resource.ResourceName) {
          name = data.Resource.ResourceName;
        } else if (data.DeviceName && data.Resource.ChannelNo != undefined) {
          name = `${data.DeviceName}-${data.Resource.ChannelNo}`;
        }
      }
      return name;
    },
    color: (type: number) => {
      let color = 'yellow';
      switch (type) {
        case 1:
          color = 'green';
          break;
        case 2:
          color = 'red';
          break;
        default:
          break;
      }
      return color;
    },
    icon: (id: string, db31 = false) => {
      if (db31) {
        return this.get.db31(id);
      } else {
        return this.get.device(id);
      }
    },
    device: async (id: string) => {
      try {
        let device = await this.service.device.cache.get(id);
        return IconTool.DeviceType(device.DeviceType);
      } catch (error) {
        return '';
      }
    },
    db31: async (id: string) => {
      try {
        let device = await this.service.db31.device.cache.get(id);
        return IconTool.DeviceType(device.DeviceType, true);
      } catch (error) {
        return '';
      }
    },
  };

  test() {
    let datas: DeviceEventRecord[] = [];
    for (let i = 0; i < 100; i++) {
      let item = new DeviceEventRecord();
      item.EventTime = new Date();
      item.EventType = (i % 20) + 1;
      item.DeviceName = '设备' + (i + 1);
      item.Resource = new DeviceEventResource();
      item.Resource.ResourceType = (i % 4) + 1;
      datas.push(item);
    }
    console.log(datas);
    let all = datas.map((x) => this.convert(x));
    return Promise.all(all);
  }

  private async types(value: SystemMainRecordTableEventType) {
    let devicetypes = [1, 2];
    let enabledtypes = [1, 2, 101, 102];

    let types = (await this.capability.event.EventTypes)
      .map((x) => x.Value)
      .filter((x) => enabledtypes.includes(x));

    switch (value) {
      case SystemMainRecordTableEventType.device:
        break;

      default:
        break;
    }

    return types.filter((x) => {
      switch (value) {
        case SystemMainRecordTableEventType.device:
          return devicetypes.includes(x);
        default:
          return !devicetypes.includes(x);
      }
    });
  }
}
