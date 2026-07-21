import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateTimeControlComponent } from '../../../common/components/date-time-control/date-time-control.component';
import { HowellSelectComponent } from '../../../common/components/hw-select/select-control.component';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { DateTimePickerView } from '../../../common/directives/date-time-picker/date-time-picker.directive';
import { Language } from '../../../common/tools/language-tool/language';
import { SystemRecordEntranceTableComponent } from '../system-record-table-entrance/system-record-table-entrance.component';
import { SystemRecordEntranceTableArgs } from '../system-record-table-entrance/system-record-table-entrance.model';
import { SystemRecordSource } from '../system-record.source';

@Component({
  selector: 'hw-system-record-entrance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HowellSelectComponent,
    DateTimeControlComponent,
    SystemRecordEntranceTableComponent,
  ],
  templateUrl: './system-record-entrance.component.html',
  styleUrl: './system-record-entrance.component.less',
  providers: [SystemRecordSource],
})
export class SystemRecordEntranceComponent {
  @Output() playback = new EventEmitter<DeviceEventRecord>();

  constructor(public source: SystemRecordSource) {}
  Language = Language;
  table = {
    view: DateTimePickerView,
    args: new SystemRecordEntranceTableArgs(),
    load: new EventEmitter<SystemRecordEntranceTableArgs>(),
    datas: [] as DeviceEventRecord[],
    on: {
      search: () => {
        this.table.args.first = true;
        this.table.load.emit(this.table.args);
      },
      loaded: (datas: DeviceEventRecord[]) => {
        this.table.datas = datas;
      },
      playback: (data: DeviceEventRecord) => {
        this.playback.emit(data);
      },
    },
  };
}
