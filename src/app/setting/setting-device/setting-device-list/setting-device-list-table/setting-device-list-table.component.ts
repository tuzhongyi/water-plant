import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PaginatorComponent } from '../../../../common/components/paginator/paginator.component';
import { Device } from '../../../../common/data-core/models/devices/device.model';
import { Page } from '../../../../common/data-core/models/interface/page-list.model';
import { TableSorterDirective } from '../../../../common/directives/table-sorter/table-soater.directive';
import { Sort } from '../../../../common/directives/table-sorter/table-sorter.model';
import { Language } from '../../../../common/tools/language-tool/language';
import { SettingDeviceListTableBusiness } from './setting-device-list-table.business';
import {
  SettingDeviceListTableArgs,
  SettingDeviceListTableFilter,
} from './setting-device-list-table.model';

@Component({
  selector: 'hw-setting-device-list-table',
  imports: [CommonModule, PaginatorComponent, TableSorterDirective],
  templateUrl: './setting-device-list-table.component.html',
  styleUrl: './setting-device-list-table.component.less',
  providers: [SettingDeviceListTableBusiness],
})
export class SettingDeviceListTableComponent implements OnInit, OnDestroy {
  @Input() args = new SettingDeviceListTableArgs();
  @Input('load') input_load?: EventEmitter<SettingDeviceListTableArgs>;
  @Input() details = new EventEmitter<Device>();

  constructor(private business: SettingDeviceListTableBusiness) {}

  widths = [];
  minwidth = [];
  datas = signal<(Device | undefined)[]>([]);
  page = Page.create(1, 10);
  selected?: Device;

  Language = Language;
  Math = Math;

  private filter = new SettingDeviceListTableFilter();
  private subscription = new Subscription();

  ngOnInit(): void {
    if (this.input_load) {
      let sub = this.input_load.subscribe((x) => {
        this.args = x;
        this.filter = SettingDeviceListTableFilter.from(this.args);
        this.load(this.args.first ? 1 : this.page.PageIndex, this.page.PageSize, this.filter);
      });
      this.subscription.add(sub);
    }
    this.filter = SettingDeviceListTableFilter.from(this.args);
    this.load(1, this.page.PageSize, this.filter);
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private load(index: number, size: number, filter: SettingDeviceListTableFilter) {
    this.business.load(index, size, filter).then((x) => {
      this.page = x.Page;
      let datas: (Device | undefined)[] = x.Data;

      while (datas.length < this.page.PageSize) {
        datas.push(undefined);
      }
      this.datas.set(datas);
    });
  }

  onselect(item?: Device) {
    if (item) {
      if (this.selected === item) {
        this.selected = undefined;
      } else {
        this.selected = item;
      }
    }
  }

  on = {
    page: (index: number) => {
      this.load(index, this.page.PageSize, this.filter);
    },
    sort: (sort: Sort) => {
      this.filter.asc = undefined;
      this.filter.desc = undefined;
      if (sort.direction === 'asc') {
        this.filter.asc = sort.active;
      } else {
        this.filter.desc = sort.active;
      }
      this.load(this.page.PageIndex, this.page.PageSize, this.filter);
    },

    details: (e: Event, item: Device) => {
      this.details.emit(item);
      if (this.selected === item) {
        e.stopImmediatePropagation();
      }
    },
  };
}
