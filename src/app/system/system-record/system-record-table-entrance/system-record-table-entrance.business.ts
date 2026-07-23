import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { PagedList } from '../../../common/data-core/models/interface/page-list.model';
import { ConfigRequestService } from '../../../common/data-core/request/config/config-request.service';
import { GetDeviceEventRecordsParams } from '../../../common/data-core/request/services/event/event.params';
import { EventRequestService } from '../../../common/data-core/request/services/event/event.service';
import { Language } from '../../../common/tools/language-tool/language';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
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
  ) {}

  async load(index: number, size: number, filter: SystemRecordEntranceTableFilter) {
    let datas = await this.data.load(index, size, filter);
    if (datas.Page.RecordCount == 0 && datas.Page.PageIndex > 1) {
      datas = await this.data.load(index - 1, size, filter);
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
