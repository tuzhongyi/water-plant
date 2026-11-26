import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { DeviceEventRecord } from '../../../../common/data-core/models/events/device-event-record.model';
import { DeviceEventResource } from '../../../../common/data-core/models/events/device-event-resource.model';
import { ConfigRequestService } from '../../../../common/data-core/request/config/config-request.service';
import { DB31RequestService } from '../../../../common/data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../../../common/data-core/request/services/device/device.service';
import { GetDeviceEventRecordsParams } from '../../../../common/data-core/request/services/event/event.params';
import { EventRequestService } from '../../../../common/data-core/request/services/event/event.service';
import { CapabilityTool } from '../../../../common/tools/capability-tool/capability.tool';
import { DateTimeTool } from '../../../../common/tools/date-time-tool/datetime.tool';
import { IconTool } from '../../../../common/tools/icon-tool/icon.tool';
import { Language } from '../../../../common/tools/language-tool/language';
import { LanguageTool } from '../../../../common/tools/language-tool/language.tool';
import { PermissionTool } from '../../../../common/tools/permission-tool/permission.tool';
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
    private config: ConfigRequestService,
    private capability: CapabilityTool,
    private language: LanguageTool,
    private permission: PermissionTool,
  ) {
    this.service = { event, device, db31 };
  }

  private service: {
    event: EventRequestService;
    device: DeviceRequestService;
    db31: DB31RequestService;
  };

  async load(args: SystemMainRecordTableArgs) {
    /* 回放按钮要按通道权限判断，先把用户权限（含可查看通道）准备好 */
    await this.permission.load().catch(() => {});
    let duration = DateTimeTool.last.month(new Date());
    let params = new GetDeviceEventRecordsParams();
    params.BeginTime = duration.begin;
    params.EndTime = duration.end;
    params.PageIndex = 1;
    params.PageSize = 100;
    params.Desc = 'EventTime';
    if (args.type) {
      params.EventTypes = await this.types(args.type);
    } else {
      params.EventTypes = await this.types();
    }

    let paged = await this.service.event.record.list(params);
    let all = paged.Data.map((x) => this.convert(x));
    let items = await Promise.all(all);
    /* 只显示与当前用户可查看通道相关的报警记录（根用户全部显示） */
    let datas = items.filter((x) => this.get.permitted(x.data));
    return {
      datas,
      /* 服务端总数：用来区分“正好 100 条”和“超过 100 条被截断” */
      total: paged.Page.TotalRecordCount ?? paged.Page.RecordCount,
    };
  }

  private async convert(data: DeviceEventRecord) {
    let icon = IconTool.DeviceEventResource(data.Resource?.ResourceType);
    if (!icon && data.DeviceId) {
      icon = await this.get.icon(data.DeviceId, data.FromDB31);
    }

    let item: SystemMainRecordTableItem = {
      id: data.Id,
      time: formatDate(data.EventTime, Language.yyyyMMddHHmmss, 'en'),
      name: this.get.name(data),
      description: data.Description,
      color: this.get.color(data.EventType, data.TriggerType),
      icon: icon,
      type: await this.language.event.EventTypes(data.EventType),
      playback: this.get.playback(data),
      data: data,
    };
    item.description = `${item.name}\n${item.type}\n${item.time}\n${data.Description}`;
    return item;
  }

  get = {
    /**	记录是否与当前用户可查看的通道相关：只显示这些记录，根用户全部显示 */
    permitted: (data: DeviceEventRecord) => {
      if (this.permission.isRoot) return true;
      let ids = this.get.channelIds(data);
      return ids.some((id) => this.permission.canChannel(id));
    },
    /**	能否回放：需要「回放」权限，并且记录关联的通道在当前用户可查看的通道内 */
    playback: (data: DeviceEventRecord) => {
      if (!this.permission.playback) return false;
      let ids = this.get.channelIds(data);
      return ids.some((id) => this.permission.canChannel(id));
    },
    /**	记录关联的视频通道 Id：联动动作的 ResourceId 和报警资源的 ResourceId
        （DeviceId 是设备 Id，不是通道 Id，不能用来判断通道权限） */
    channelIds: (data: DeviceEventRecord) => {
      let ids: string[] = [];
      for (const action of data.Actions ?? []) {
        if (action.ResourceId) ids.push(action.ResourceId);
      }
      if (data.Resource?.ResourceId) ids.push(data.Resource.ResourceId);
      return ids;
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
    color: (type: number, target: number) => {
      let color = 'yellow';
      switch (type) {
        case 1:
          color = 'green';
          break;
        case 2:
          color = 'red';
          break;
        default:
          switch (target) {
            case 2:
              color = 'yellow';
              break;
            case 3:
              color = 'green';
              break;

            default:
              break;
          }
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

  private async types(value?: SystemMainRecordTableEventType) {
    let config = await this.config.get();
    let devicetypes = [...config.event.device];
    let alarmtypes = [...config.event.alarm, ...config.event.other];
    let enabledtypes = [...devicetypes, ...alarmtypes];

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
        case SystemMainRecordTableEventType.alarm:
          return alarmtypes.includes(x);
        default:
          return enabledtypes.includes(x);
      }
    });
  }
}
