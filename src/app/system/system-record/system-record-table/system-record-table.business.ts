import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { PagedList } from '../../../common/data-core/models/interface/page-list.model';
import { GetDeviceEventRecordsParams } from '../../../common/data-core/request/services/event/event.params';
import { EventRequestService } from '../../../common/data-core/request/services/event/event.service';
import { Language } from '../../../common/tools/language-tool/language';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import { PermissionTool } from '../../../common/tools/permission-tool/permission.tool';
import { wait } from '../../../common/tools/wait';
import { SystemRecordSource } from '../system-record.source';
import { SystemRecordTableFilter, SystemRecordTableItem } from './system-record-table.model';

@Injectable()
export class SystemRecordTableBusiness {
  constructor(
    private event: EventRequestService,
    private language: LanguageTool,
    private source: SystemRecordSource,
    private permission: PermissionTool,
  ) {}

  async load(index: number, size: number, filter: SystemRecordTableFilter) {
    /* 回放按钮和记录筛选都要按通道权限判断，先把用户权限（含可查看通道）准备好 */
    await this.permission.load().catch(() => {});
    let datas = await this.data.load(index, size, filter);
    if (datas.Page.RecordCount == 0 && datas.Page.PageIndex > 1) {
      datas = await this.data.load(index - 1, size, filter);
    }
    /* 只显示与当前用户可查看通道相关的报警记录（根用户全部显示）；
        当前页全被过滤掉时退回上一页，避免出现空白页 */
    datas.Data = datas.Data.filter((x) => this.get.permitted(x));
    if (datas.Data.length == 0 && datas.Page.PageIndex > 1) {
      datas = await this.data.load(datas.Page.PageIndex - 1, size, filter);
      datas.Data = datas.Data.filter((x) => this.get.permitted(x));
    }
    let paged = new PagedList<SystemRecordTableItem<DeviceEventRecord>>();

    paged.Page = datas.Page;
    paged.Data = datas.Data.map((x) => this.convert(x));

    return paged;
  }

  private convert(data: DeviceEventRecord) {
    let item: SystemRecordTableItem = {
      id: data.Id,
      time: formatDate(data.EventTime, Language.YearMonthDayHHmmss, 'en'),
      type: this.language.event.EventTypes(data.EventType),
      description: data.Description ?? '',
      name: data.Resource?.ResourceName ?? data.DeviceName ?? '',
      value: data.Resource?.Value ?? '',
      typecolor: this.get.typecolor(data.EventType),
      trigger: this.language.event.TriggerTypes(data.TriggerType),
      triggercolor: this.get.triggercolor(data.TriggerType),
      playback: this.get.playback(data),
      data: data,
    };
    return item;
  }

  private get = {
    typecolor: (type: number) => {
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
    triggercolor: (type: number) => {
      let color = 'normal';
      switch (type) {
        case 1:
          color = 'normal';
          break;
        case 2:
        case 4:
          color = 'red';
          break;
        case 3:
          color = 'green';
          break;
        default:
          break;
      }
      return color;
    },
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
  };

  private data = {
    load: async (index: number, size: number, filter: SystemRecordTableFilter) => {
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
        await wait(() => {
          return this.source.loaded;
        });
        params.EventTypes = this.source.types.map((x) => x.Value);
      }

      params.Asc = filter.asc;
      params.Desc = filter.desc;

      return this.event.record.list(params);
    },
  };
}
