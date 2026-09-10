import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PaginatorComponent } from '../../../common/components/paginator/paginator.component';
import { IDevice } from '../../../common/data-core/models/common/device.interface';
import { Device } from '../../../common/data-core/models/devices/device.model';
import { Page } from '../../../common/data-core/models/interface/page-list.model';
import { Language } from '../../../common/tools/language-tool/language';
import { SystemDeviceTableBusiness } from './system-device-table.business';
import {
  SystemDeviceTableArgs,
  SystemDeviceTableItem,
  SystemDeviceTableLoad,
} from './system-device-table.model';

@Component({
  selector: 'hw-system-device-table',
  imports: [CommonModule, PaginatorComponent],
  templateUrl: './system-device-table.component.html',
  styleUrl: './system-device-table.component.less',
  providers: [SystemDeviceTableBusiness],
})
export class SystemDeviceTableComponent implements OnInit, OnDestroy {
  @Input() args: SystemDeviceTableArgs = {};
  @Input('load') input_load?: EventEmitter<SystemDeviceTableLoad>;
  @Input('datas') source: IDevice[] = [];
  @Output() preview = new EventEmitter<Device>();
  @Output() channel = new EventEmitter<IDevice>();
  @Output() select = new EventEmitter<IDevice>();

  constructor(private business: SystemDeviceTableBusiness) {}

  widths = ['8%', 'auto', '15%', '30%', '15%'];
  minwidth = [];
  datas = signal<(SystemDeviceTableItem | undefined)[]>([]);
  page = Page.create(1, 10);
  selected?: SystemDeviceTableItem;

  Language = Language;
  Math = Math;

  private extra: IDevice[] = [];
  private subscription = new Subscription();

  ngOnInit(): void {
    if (this.input_load) {
      let sub = this.input_load.subscribe((x) => {
        this.args = Object.assign(this.args, x.args);
        this.extra = x.extra ?? [];

        this.load(1, this.page.PageSize, this.args, this.source);
      });
      this.subscription.add(sub);
    }
    this.load(1, this.page.PageSize, this.args, this.source);
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private load(index: number, size: number, args: SystemDeviceTableArgs, source: IDevice[]) {
    this.business.load(index, size, args, source, this.extra).then((x) => {
      this.page = x.Page;
      let datas: (SystemDeviceTableItem | undefined)[] = x.Data;

      while (datas.length < this.page.PageSize) {
        datas.push(undefined);
      }
      this.datas.set(datas);
    });
  }

  onselect(item?: SystemDeviceTableItem) {
    if (item) {
      if (this.selected === item) {
        // this.selected = undefined;
        // this.select.emit();
      } else {
        this.selected = item;
        this.select.emit(item.data);
      }
    } else {
      this.select.emit();
    }
  }

  on = {
    page: (index: number) => {
      this.load(index, this.page.PageSize, this.args, this.source);
    },
    preview: (e: Event, item: SystemDeviceTableItem) => {
      if (item.data instanceof Device) {
        this.preview.emit(item.data);
      }

      if (this.selected === item) {
        e.stopImmediatePropagation();
      }
    },
    channel: (e: Event, item?: SystemDeviceTableItem) => {
      this.channel.emit(item?.data);

      if (this.selected === item) {
        e.stopImmediatePropagation();
      }
    },
  };
}
