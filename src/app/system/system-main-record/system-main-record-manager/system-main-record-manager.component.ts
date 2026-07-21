import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { CardComponent } from '../../../common/components/card/card.component';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { SystemMainRecordTableComponent } from '../system-main-record-table/system-main-record-table.component';
import {
  SystemMainRecordTableArgs,
  SystemMainRecordTableEventType,
} from '../system-main-record-table/system-main-record-table.model';

@Component({
  selector: 'hw-system-main-record-manager',
  imports: [CommonModule, CardComponent, SystemMainRecordTableComponent],
  templateUrl: './system-main-record-manager.component.html',
  styleUrl: './system-main-record-manager.component.less',
})
export class SystemMainRecordManagerComponent {
  @Output() playback = new EventEmitter<DeviceEventRecord>();
  @Output() all = new EventEmitter<void>();
  Type = SystemMainRecordTableEventType;
  table = {
    args: new SystemMainRecordTableArgs(),
    load: new EventEmitter<SystemMainRecordTableArgs>(),
    datas: [] as DeviceEventRecord[],
    on: {
      loaded: (datas: DeviceEventRecord[]) => {
        this.table.datas = datas;
      },
      filter: (type?: SystemMainRecordTableEventType) => {
        this.table.args.type = type;
        this.table.load.emit(this.table.args);
      },
      playback: (data: DeviceEventRecord) => {
        this.playback.emit(data);
      },
    },
  };

  on = {
    all: () => {
      this.all.emit();
    },
  };
}
