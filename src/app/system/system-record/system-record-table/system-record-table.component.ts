import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PaginatorComponent } from '../../../common/components/paginator/paginator.component';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { Page } from '../../../common/data-core/models/interface/page-list.model';
import { TableSorterDirective } from '../../../common/directives/table-sorter/table-soater.directive';
import { Sort } from '../../../common/directives/table-sorter/table-sorter.model';
import { IconTool } from '../../../common/tools/icon-tool/icon.tool';
import { Language } from '../../../common/tools/language-tool/language';
import { SystemRecordTableBusiness } from './system-record-table.business';
import {
  SystemRecordTableArgs,
  SystemRecordTableFilter,
  SystemRecordTableItem,
} from './system-record-table.model';

@Component({
  selector: 'hw-system-record-table',
  standalone: true,
  imports: [CommonModule, PaginatorComponent, TableSorterDirective],
  templateUrl: './system-record-table.component.html',
  styleUrl: './system-record-table.component.less',
  providers: [SystemRecordTableBusiness],
})
export class SystemRecordTableComponent implements OnInit, OnDestroy {
  @Input() args = new SystemRecordTableArgs();
  @Input('load') input_load?: EventEmitter<SystemRecordTableArgs>;
  @Output() playback = new EventEmitter<DeviceEventRecord>();
  @Output() loaded = new EventEmitter<DeviceEventRecord[]>();

  constructor(private business: SystemRecordTableBusiness) {}

  widths = ['5%', 'auto', '10%', '20%', 'auto', '8%'];
  minwidth = ['50px', '150px', '120px', '100px', '120px', '70px'];
  datas = signal<(SystemRecordTableItem | undefined)[]>([]);
  page = Page.create(1, 10);
  selected?: SystemRecordTableItem;

  Language = Language;
  Icon = IconTool;
  Math = Math;

  private filter = new SystemRecordTableFilter();
  private subscription = new Subscription();

  ngOnInit(): void {
    if (this.input_load) {
      let sub = this.input_load.subscribe((x) => {
        this.args = x;
        this.filter = SystemRecordTableFilter.from(this.args);
        this.load(this.args.first ? 1 : this.page.PageIndex, this.page.PageSize, this.filter);
      });
      this.subscription.add(sub);
    }
    this.filter = SystemRecordTableFilter.from(this.args);
    this.load(1, this.page.PageSize, this.filter);
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private load(index: number, size: number, filter: SystemRecordTableFilter) {
    this.business.load(index, size, filter).then((paged) => {
      this.page = paged.Page;
      let items: (SystemRecordTableItem | undefined)[] = [...paged.Data];

      while (items.length < this.page.PageSize) {
        items.push(undefined);
      }
      this.datas.set(items);
      this.loaded.emit(paged.Data.map((x) => x.data));
    });
  }

  on = {
    select: (item?: SystemRecordTableItem) => {
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
    sort: (_sort: Sort) => {
      this.filter.asc = undefined;
      this.filter.desc = undefined;
      if (_sort.direction == 'asc') {
        this.filter.asc = _sort.active;
      } else {
        this.filter.desc = _sort.active;
      }

      this.load(this.page.PageIndex, this.page.PageSize, this.filter);
    },
    playback: (e: Event, item: SystemRecordTableItem) => {
      this.playback.emit(item.data);
      if (this.selected == item) {
        e.stopPropagation();
      }
    },
  };
}
