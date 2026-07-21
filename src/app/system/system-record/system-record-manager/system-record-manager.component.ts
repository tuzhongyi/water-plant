import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateTimeControlComponent } from '../../../common/components/date-time-control/date-time-control.component';
import { HowellSelectComponent } from '../../../common/components/hw-select/select-control.component';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { DateTimePickerView } from '../../../common/directives/date-time-picker/date-time-picker.directive';
import { Language } from '../../../common/tools/language-tool/language';
import { SystemRecordTableComponent } from '../system-record-table/system-record-table.component';
import { SystemRecordTableArgs } from '../system-record-table/system-record-table.model';
import { SystemRecordSource } from '../system-record.source';

@Component({
  selector: 'hw-system-record-manager',
  imports: [
    CommonModule,
    FormsModule,
    HowellSelectComponent,
    DateTimeControlComponent,
    SystemRecordTableComponent,
  ],
  templateUrl: './system-record-manager.component.html',
  styleUrl: './system-record-manager.component.less',
  providers: [SystemRecordSource],
})
export class SystemRecordManagerComponent {
  @Output() playback = new EventEmitter<DeviceEventRecord>();

  constructor(public source: SystemRecordSource) {}
  Language = Language;
  table = {
    view: DateTimePickerView,
    args: new SystemRecordTableArgs(),
    load: new EventEmitter<SystemRecordTableArgs>(),
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
