import { Injectable } from '@angular/core';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { DeviceEventResource } from '../../../common/data-core/models/events/device-event-resource.model';
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
    private capability: CapabilityTool,
    private language: LanguageTool,
  ) {
    this.service = { event, device };
  }

  private service: {
    event: EventRequestService;
    device: DeviceRequestService;
  };

  async load(args: SystemMainRecordTableArgs) {
    let duration = DateTimeTool.last.year(new Date());
    let params = new GetDeviceEventRecordsParams();
    params.BeginTime = duration.begin;
    params.EndTime = duration.end;
    params.PageIndex = 1;
    params.PageSize = 100;
    if (args.type) {
      params.EventTypes = await this.types(args.type);
    }

    let datas = await this.service.event.record.all(params);
    let all = datas.map((x) => this.convert(x));
    return Promise.all(all);
  }

  private async convert(data: DeviceEventRecord) {
    let icon = IconTool.DeviceEventResource(data.Resource?.ResourceType);
    if (!icon && data.DeviceId) {
      try {
        let device = await this.service.device.cache.get(data.DeviceId);
        icon = IconTool.DeviceType(device.DeviceType);
      } catch (error) {}
    }
    let item: SystemMainRecordTableItem = {
      id: data.Id,
      time: data.EventTime,
      name: data.Resource?.ResourceName || data.DeviceName || '',
      description: data.Description,
      color: this.color(data.EventType),
      icon: icon,
      type: await this.language.event.EventTypes(data.EventType),

      data: data,
    };
    return item;
  }

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

  private color(type: number) {
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
  }

  private async types(value: SystemMainRecordTableEventType) {
    let types = (await this.capability.event.EventTypes).map((x) => x.Value);

    switch (value) {
      case SystemMainRecordTableEventType.device:
        break;

      default:
        break;
    }

    let devicetypes = [1, 2];

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
