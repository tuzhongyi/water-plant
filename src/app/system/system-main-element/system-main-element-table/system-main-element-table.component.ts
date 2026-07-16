import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { PaginatorComponent } from '../../../common/components/paginator/paginator.component';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { Page } from '../../../common/data-core/models/interface/page-list.model';
import { SystemMainElementTableBusiness } from './system-main-element-table.business';
import {
  SystemMainElementTableArgs,
  SystemMainElementTableItem,
} from './system-main-element-table.model';

@Component({
  selector: 'hw-system-main-element-table',
  imports: [CommonModule, PaginatorComponent],
  templateUrl: './system-main-element-table.component.html',
  styleUrl: './system-main-element-table.component.less',
})
export class SystemMainElementTableComponent implements OnInit, OnDestroy {
  @Input() args = new SystemMainElementTableArgs();
  @Input('load') input_load?: EventEmitter<SystemMainElementTableArgs>;

  @Input() selecteds: GeoMapElement[] = [];
  @Output() selectedsChange = new EventEmitter<GeoMapElement[]>();

  @Output() position = new EventEmitter<GeoMapElement>();
  @Output() video = new EventEmitter<GeoMapElement>();

  constructor(private business: SystemMainElementTableBusiness) {}

  widths = [];
  datas: (SystemMainElementTableItem | undefined)[] = [];
  page = Page.create(1, 10);

  private subscription = new Subscription();

  ngOnInit(): void {
    if (this.input_load) {
      let sub = this.input_load.subscribe((x) => {
        this.args = x;

        this.load(this.args.first ? 1 : this.page.PageIndex, this.page.PageSize, this.args);
      });
      this.subscription.add(sub);
    }

    this.load(1, this.page.PageSize, this.args);
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private load(index: number, size: number, args: SystemMainElementTableArgs) {
    this.business.load(index, size, args).then((x) => {
      this.page = x.Page;
      this.datas = x.Data;

      while (this.datas.length < this.page.PageSize) {
        this.datas.push(undefined);
      }
    });
  }

  select = {
    on: (item?: SystemMainElementTableItem) => {
      if (!item) return;
      let index = this.selecteds.findIndex((x) => x.Id === item.data.Id);
      if (index < 0) {
        this.selecteds.push(item.data);
      } else {
        this.selecteds.splice(index, 1);
      }
      this.selectedsChange.emit(this.selecteds);
    },
    all: () => {
      if (this.selecteds.length === this.page.RecordCount) {
        this.selecteds = [];
      } else {
        this.selecteds = [];
        for (let i = 0; i < this.datas.length; i++) {
          const data = this.datas[i];
          if (data) {
            this.selecteds.push(data.data);
          }
        }
      }
      this.selectedsChange.emit(this.selecteds);
    },
    clear: () => {
      this.selecteds = [];
      this.selectedsChange.emit(this.selecteds);
    },
  };

  onpage(index: number) {
    this.load(index, this.page.PageSize, this.args);
  }

  onposition(e: Event, item: SystemMainElementTableItem) {
    this.position.emit(item.data);
    if (this.selecteds.find((x) => x.Id == item.id)) {
      e.stopPropagation();
    }
  }
  onvideo(e: Event, item: SystemMainElementTableItem) {
    this.video.emit(item.data);
    if (this.selecteds.find((x) => x.Id == item.id)) {
      e.stopPropagation();
    }
  }
}
