import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
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
export class SystemMainRecordManagerComponent implements OnInit, OnDestroy {
  @Input() load?: EventEmitter<void>;
  @Output() playback = new EventEmitter<DeviceEventRecord>();
  @Output() all = new EventEmitter<void>();

  constructor() {}

  Type = SystemMainRecordTableEventType;
  private subs = new Subscription();

  ngOnInit(): void {
    this.regist();
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private regist() {
    if (this.load) {
      this.subs.add(
        this.load.subscribe((x) => {
          this.table.load.emit(this.table.args);
        }),
      );
    }
  }

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
