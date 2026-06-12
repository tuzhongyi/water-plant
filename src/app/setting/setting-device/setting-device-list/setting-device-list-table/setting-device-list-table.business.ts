import { Injectable } from '@angular/core';
import { GetDevicesParams } from '../../../../common/data-core/request/services/device/device.params';
import { DeviceRequestService } from '../../../../common/data-core/request/services/device/device.service';
import { SettingDeviceListTableFilter } from './setting-device-list-table.model';

@Injectable()
export class SettingDeviceListTableBusiness {
  constructor(private service: DeviceRequestService) {}

  async load(index: number, size: number, filter: SettingDeviceListTableFilter) {
    let data = await this.data.load(index, size, filter);
    if (data.Page.RecordCount == 0 && data.Page.PageIndex > 1) {
      data = await this.data.load(index - 1, size, filter);
    }

    // let paged = new PagedList<SettingDeviceListTableItem>();
    // paged.Data = data.Data.map((x) => this.convert(x));
    // paged.Page = data.Page;
    // return paged;
    return data;
  }

  private data = {
    load: (index: number, size: number, filter: SettingDeviceListTableFilter) => {
      let params = new GetDevicesParams();
      params.PageIndex = index;
      params.PageSize = size;

      params.AlarmReceived = filter.alarm;
      params.DeviceState = filter.state;
      params.Name = filter.name;

      return this.service.list(params);
    },
  };
}
