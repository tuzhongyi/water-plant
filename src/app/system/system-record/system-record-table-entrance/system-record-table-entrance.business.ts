import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { PagedList } from '../../../common/data-core/models/interface/page-list.model';
import { ConfigRequestService } from '../../../common/data-core/request/config/config-request.service';
import { GetDeviceEventRecordsParams } from '../../../common/data-core/request/services/event/event.params';
import { EventRequestService } from '../../../common/data-core/request/services/event/event.service';
import { Language } from '../../../common/tools/language-tool/language';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import { PermissionTool } from '../../../common/tools/permission-tool/permission.tool';
import {
  SystemRecordEntranceTableFilter,
  SystemRecordEntranceTableItem,
} from './system-record-table-entrance.model';

@Injectable()
export class SystemRecordEntranceTableBusiness {
  constructor(
    private event: EventRequestService,
    private language: LanguageTool,
    private config: ConfigRequestService,
    private permission: PermissionTool,
  ) {}

  async load(index: number, size: number, filter: SystemRecordEntranceTableFilter) {
    /*	通道权限要等权限组加载完成后再判断 */
    await this.permission.load().catch(() => {});
    let datas = await this.data.load(index, size, filter);
    if (datas.Page.RecordCount == 0 && datas.Page.PageIndex > 1) {
      datas = await this.data.load(index - 1, size, filter);
    }
    /*	只显示当前用户有权限查看的通道相关记录；没有关联通道的记录不受通道权限限制 */
    datas.Data = datas.Data.filter((x) => this.get.permitted(x));
    if (datas.Data.length == 0 && datas.Page.PageIndex > 1) {
      datas = await this.data.load(datas.Page.PageIndex - 1, size, filter);
      datas.Data = datas.Data.filter((x) => this.get.permitted(x));
    }
    let paged = new PagedList<SystemRecordEntranceTableItem<DeviceEventRecord>>();

    paged.Page = datas.Page;
    paged.Data = datas.Data.map((x) => this.convert(x));

    return paged;
  }

  private convert(data: DeviceEventRecord) {
    let item: SystemRecordEntranceTableItem = {
      id: data.Id,
      time: formatDate(data.EventTime, Language.YearMonthDayHHmmss, 'en'),
      type: this.language.event.EventTypes(data.EventType),
      description: data.Description ?? '',
      name: data.Resource?.ResourceName ?? data.DeviceName ?? '',
      value: data.Resource?.Value ?? '',
      color: this.get.color(data.EventType),
      playback: this.get.playback(data),
      data: data,
    };
    return item;
  }

  private get = {
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
    /**	记录是否与当前用户可查看的通道相关：有关联通道时按通道权限过滤，
        没有关联通道（纯门禁进出记录）不受通道权限限制；根用户全部显示 */
    permitted: (data: DeviceEventRecord) => {
      if (this.permission.isRoot) return true;
      let ids = this.get.channelIds(data);
      if (ids.length == 0) return true;
      return ids.some((id) => this.permission.canChannel(id));
    },
    /**	能否回放：需要回放权限，并且有关联通道在当前用户可查看的通道内 */
    playback: (data: DeviceEventRecord) => {
      if (!this.permission.playback) return false;
      let ids = this.get.channelIds(data);
      return ids.some((id) => this.permission.canChannel(id));
    },
    /**	记录关联的视频通道 Id：门禁记录通过联动动作关联摄像机 */
    channelIds: (data: DeviceEventRecord) => {
      let ids: string[] = [];
      for (const action of data.Actions ?? []) {
        if (action.ResourceId) ids.push(action.ResourceId);
      }
      return ids;
    },
  };

  private data = {
    load: async (index: number, size: number, filter: SystemRecordEntranceTableFilter) => {
      let params = new GetDeviceEventRecordsParams();
      params.PageIndex = index;
      params.PageSize = size;
      params.BeginTime = filter.duration.begin;
      params.EndTime = filter.duration.end;

      if (filter.name) {
        params.Name = filter.name;
      }
      if (filter.type != undefined) {
        params.EventTypes = [filter.type];
      } else {
        let config = await this.config.get();
        params.EventTypes = config.event.entrance;
      }

      if (filter.value) {
        params.Value = filter.value;
      }

      params.Asc = filter.asc;
      params.Desc = filter.desc;

      return this.event.record.list(params);
    },
  };
}
