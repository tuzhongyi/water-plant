import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PaginatorComponent } from '../../../../common/components/paginator/paginator.component';
import { MapElementType } from '../../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { Page } from '../../../../common/data-core/models/interface/page-list.model';
import { TableSorterDirective } from '../../../../common/directives/table-sorter/table-soater.directive';
import { Language } from '../../../../common/tools/language-tool/language';
import { SettingMapElementTableBusiness } from './setting-map-element-table.business';
import {
  SettingMapElementTableArgs,
  SettingMapElementTableFilter,
} from './setting-map-element-table.model';

@Component({
  selector: 'hw-setting-map-element-table',
  standalone: true,
  imports: [CommonModule, PaginatorComponent, TableSorterDirective],
  templateUrl: './setting-map-element-table.component.html',
  styleUrl: './setting-map-element-table.component.less',
  providers: [SettingMapElementTableBusiness],
})
export class SettingMapElementTableComponent implements OnInit, OnDestroy {
  @Input() args = new SettingMapElementTableArgs();
  @Input('load') input_load?: EventEmitter<SettingMapElementTableArgs>;
  @Input() details = new EventEmitter<GeoMapElement>();

  constructor(private business: SettingMapElementTableBusiness) {}

  widths = [];
  minwidth = [];
  datas = signal<(GeoMapElement | undefined)[]>([]);
  page = Page.create(1, 10);
  selected?: GeoMapElement;

  Language = Language;
  Math = Math;
  MapElementType = MapElementType;

  private filter = new SettingMapElementTableFilter();
  private subscription = new Subscription();

  ngOnInit(): void {
    if (this.input_load) {
      let sub = this.input_load.subscribe((x) => {
        this.args = x;
        this.filter = SettingMapElementTableFilter.from(this.args);
        this.load(this.args.first ? 1 : this.page.PageIndex, this.page.PageSize, this.filter);
      });
      this.subscription.add(sub);
    }
    this.filter = SettingMapElementTableFilter.from(this.args);
    this.load(1, this.page.PageSize, this.filter);
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private load(index: number, size: number, filter: SettingMapElementTableFilter) {
    this.business.load(index, size, filter).then((x) => {
      this.page = x.Page;
      let datas: (GeoMapElement | undefined)[] = x.Data;

      while (datas.length < this.page.PageSize) {
        datas.push(undefined);
      }
      this.datas.set(datas);
    });
  }

  onselect(item?: GeoMapElement) {
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
    sort: (_sort: any) => {
      this.load(this.page.PageIndex, this.page.PageSize, this.filter);
    },
    details: (e: Event, item: GeoMapElement) => {
      this.details.emit(item);
      if (this.selected === item) {
        e.stopImmediatePropagation();
      }
    },
  };
}
