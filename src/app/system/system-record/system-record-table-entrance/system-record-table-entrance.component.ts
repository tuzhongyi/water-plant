import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PaginatorComponent } from '../../../common/components/paginator/paginator.component';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { Page } from '../../../common/data-core/models/interface/page-list.model';
import { TableSorterDirective } from '../../../common/directives/table-sorter/table-soater.directive';
import { IconTool } from '../../../common/tools/icon-tool/icon.tool';
import { Language } from '../../../common/tools/language-tool/language';
import { SystemRecordEntranceTableBusiness } from './system-record-table-entrance.business';
import {
  SystemRecordEntranceTableArgs,
  SystemRecordEntranceTableFilter,
  SystemRecordEntranceTableItem,
} from './system-record-table-entrance.model';

@Component({
  selector: 'hw-system-record-table-entrance',
  standalone: true,
  imports: [CommonModule, PaginatorComponent, TableSorterDirective],
  templateUrl: './system-record-table-entrance.component.html',
  styleUrl: './system-record-table-entrance.component.less',
  providers: [SystemRecordEntranceTableBusiness],
})
export class SystemRecordEntranceTableComponent implements OnInit, OnDestroy {
  @Input() args = new SystemRecordEntranceTableArgs();
  @Input('load') input_load?: EventEmitter<SystemRecordEntranceTableArgs>;
  @Output() playback = new EventEmitter<DeviceEventRecord>();
  @Output() loaded = new EventEmitter<DeviceEventRecord[]>();

  constructor(private business: SystemRecordEntranceTableBusiness) {}

  widths = ['5%', 'auto', '12%', '12%', '20%', 'auto', '8%'];
  minwidth = ['50px', '150px', '120px', '100px', '120px', '70px'];
  datas = signal<(SystemRecordEntranceTableItem | undefined)[]>([]);
  page = Page.create(1, 10);
  selected?: SystemRecordEntranceTableItem;

  Language = Language;
  Icon = IconTool;
  Math = Math;

  private filter = new SystemRecordEntranceTableFilter();
  private subscription = new Subscription();

  ngOnInit(): void {
    if (this.input_load) {
      let sub = this.input_load.subscribe((x) => {
        this.args = x;
        this.filter = SystemRecordEntranceTableFilter.from(this.args);
        this.load(this.args.first ? 1 : this.page.PageIndex, this.page.PageSize, this.filter);
      });
      this.subscription.add(sub);
    }
    this.filter = SystemRecordEntranceTableFilter.from(this.args);
    this.load(1, this.page.PageSize, this.filter);
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private load(index: number, size: number, filter: SystemRecordEntranceTableFilter) {
    this.business.load(index, size, filter).then((paged) => {
      this.page = paged.Page;
      let items: (SystemRecordEntranceTableItem | undefined)[] = [...paged.Data];

      while (items.length < this.page.PageSize) {
        items.push(undefined);
      }
      this.datas.set(items);
      this.loaded.emit(paged.Data.map((x) => x.data));
    });
  }

  on = {
    select: (item?: SystemRecordEntranceTableItem) => {
      if (item) {
        if (this.selected === item) {
          this.selected = undefined;
        } else {
          this.selected = item;
        }
      }
    },
    page: (index: number) => {
      this.load(index, this.page.PageSize, this.filter);
    },
    sort: (_sort: any) => {
      this.load(this.page.PageIndex, this.page.PageSize, this.filter);
    },
    playback: (e: Event, item: SystemRecordEntranceTableItem) => {
      this.playback.emit(item.data);
      if (this.selected == item) {
        e.stopPropagation();
      }
    },
  };
}
