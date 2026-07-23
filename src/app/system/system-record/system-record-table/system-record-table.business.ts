import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { PagedList } from '../../../common/data-core/models/interface/page-list.model';
import { GetDeviceEventRecordsParams } from '../../../common/data-core/request/services/event/event.params';
import { EventRequestService } from '../../../common/data-core/request/services/event/event.service';
import { Language } from '../../../common/tools/language-tool/language';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import { wait } from '../../../common/tools/wait';
import { SystemRecordSource } from '../system-record.source';
import { SystemRecordTableFilter, SystemRecordTableItem } from './system-record-table.model';

@Injectable()
export class SystemRecordTableBusiness {
  constructor(
    private event: EventRequestService,
    private language: LanguageTool,
    private source: SystemRecordSource,
  ) {}

  async load(index: number, size: number, filter: SystemRecordTableFilter) {
    let datas = await this.data.load(index, size, filter);
    if (datas.Page.RecordCount == 0 && datas.Page.PageIndex > 1) {
      datas = await this.data.load(index - 1, size, filter);
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
    playback: (data: DeviceEventRecord) => {
      switch (data.EventType) {
        case 1:
        case 2:
          return true;

        default:
          return !!data.Actions && data.Actions.length > 0;
      }
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
