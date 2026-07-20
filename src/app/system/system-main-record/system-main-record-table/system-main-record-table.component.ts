import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { IconTool } from '../../../common/tools/icon-tool/icon.tool';
import { Language } from '../../../common/tools/language-tool/language';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import { SystemMainRecordTableBusiness } from './system-main-record-table.business';
import {
  SystemMainRecordTableArgs,
  SystemMainRecordTableItem,
} from './system-main-record-table.model';

@Component({
  selector: 'hw-system-main-record-table',
  imports: [CommonModule],
  templateUrl: './system-main-record-table.component.html',
  styleUrl: './system-main-record-table.component.less',
  providers: [SystemMainRecordTableBusiness],
})
export class SystemMainRecordTableComponent implements OnInit, OnDestroy {
  @Input() args = new SystemMainRecordTableArgs();
  @Input('load') _load?: EventEmitter<SystemMainRecordTableArgs>;
  @Output() loaded = new EventEmitter<DeviceEventRecord[]>();
  @Output() playback = new EventEmitter<DeviceEventRecord>();
  @Output() details = new EventEmitter<DeviceEventRecord>();

  constructor(
    private business: SystemMainRecordTableBusiness,
    public language: LanguageTool,
  ) {}

  Icon = IconTool;
  Language = Language;
  datas: SystemMainRecordTableItem[] = [];
  width = ['10%', '25%', '25%', '160px', '7%'];
  private subs = new Subscription();

  ngOnInit(): void {
    this.regist();
    this.load(this.args);
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private regist() {
    if (this._load) {
      this.subs.add(
        this._load.subscribe((x) => {
          this.args = x;
          this.load(this.args);
        }),
      );
    }
  }

  private async load(args: SystemMainRecordTableArgs) {
    // this.datas = await this.business.test();
    this.datas = await this.business.load(args);

    this.loaded.emit(this.datas.map((x) => x.data));
  }

  on = {
    playback: (e: Event, item: SystemMainRecordTableItem) => {
      this.playback.emit(item.data);
      e.stopPropagation();
    },
    details: (e: Event, item: SystemMainRecordTableItem) => {
      this.details.emit(item.data);
      e.stopPropagation();
    },
  };
}
