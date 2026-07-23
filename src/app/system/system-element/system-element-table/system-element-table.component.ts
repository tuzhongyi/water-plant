import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PaginatorComponent } from '../../../common/components/paginator/paginator.component';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { Page } from '../../../common/data-core/models/interface/page-list.model';
import { Language } from '../../../common/tools/language-tool/language';
import { SystemElementTableBusiness } from './system-element-table.business';
import {
  SystemElementTableArgs,
  SystemElementTableFilter,
  SystemElementTableItem,
} from './system-element-table.model';

@Component({
  selector: 'hw-system-element-table',
  imports: [CommonModule, PaginatorComponent],
  templateUrl: './system-element-table.component.html',
  styleUrl: './system-element-table.component.less',
  providers: [SystemElementTableBusiness],
})
export class SystemElementTableComponent implements OnInit, OnDestroy {
  @Input() args = new SystemElementTableArgs();
  @Input('load') input_load?: EventEmitter<SystemElementTableArgs>;
  @Output() preview = new EventEmitter<GeoMapElement>();

  constructor(private business: SystemElementTableBusiness) {}

  widths = ['10%', 'auto', '15%', 'auto', '15%', '10%'];
  minwidth = [];
  datas = signal<(SystemElementTableItem | undefined)[]>([]);
  page = Page.create(1, 10);
  selected?: SystemElementTableItem;

  Language = Language;
  Math = Math;
  MapElementType = MapElementType;

  private filter = new SystemElementTableFilter();
  private subscription = new Subscription();

  ngOnInit(): void {
    if (this.input_load) {
      let sub = this.input_load.subscribe((x) => {
        this.args = x;
        this.filter = SystemElementTableFilter.from(this.args);
        this.load(this.args.first ? 1 : this.page.PageIndex, this.page.PageSize, this.filter);
      });
      this.subscription.add(sub);
    }
    this.filter = SystemElementTableFilter.from(this.args);
    this.load(1, this.page.PageSize, this.filter);
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private load(index: number, size: number, filter: SystemElementTableFilter) {
    this.business.load(index, size, filter).then((x) => {
      this.page = x.Page;
      let datas: (SystemElementTableItem | undefined)[] = x.Data;

      while (datas.length < this.page.PageSize) {
        datas.push(undefined);
      }
      this.datas.set(datas);
    });
  }

  onselect(item?: SystemElementTableItem) {
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
    preview: (e: Event, item: SystemElementTableItem) => {
      this.preview.emit(item.data);
      if (this.selected === item) {
        e.stopImmediatePropagation();
      }
    },
  };
}
