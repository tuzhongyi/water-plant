import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  signal,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { PaginatorComponent } from '../../../../common/components/paginator/paginator.component';
import { VideoChannel } from '../../../../common/data-core/models/devices/video-channel.model';
import { Page, PagedList } from '../../../../common/data-core/models/interface/page-list.model';
import { SystemVideoDeviceListBusiness } from './system-video-device-list.business';
import { SystemVideoDeviceListArgs } from './system-video-device-list.model';

@Component({
  selector: 'hw-system-video-device-list',
  imports: [CommonModule, PaginatorComponent],
  templateUrl: './system-video-device-list.component.html',
  styleUrl: './system-video-device-list.component.less',
  providers: [SystemVideoDeviceListBusiness],
})
export class SystemVideoDeviceListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() args: SystemVideoDeviceListArgs = {};
  @Input('load') _load?: EventEmitter<SystemVideoDeviceListArgs>;
  @Input() inverse: string[] = [];
  @Input() selected?: VideoChannel;
  @Output() selectedChange = new EventEmitter<VideoChannel>();
  @Output() loaded = new EventEmitter<VideoChannel[]>();
  @Output() error = new EventEmitter<Error>();
  @Output() itemdblclick = new EventEmitter<VideoChannel>();
  @Input() pagesize = 12;

  constructor(private business: SystemVideoDeviceListBusiness) {}

  source: VideoChannel[] = [];

  datas = signal<VideoChannel[]>([]);
  page = signal<Page>(Page.create(1, this.pagesize));
  private subs = new Subscription();

  ngOnChanges(changes: SimpleChanges): void {
    this.change.inverse(changes['inverse']);
  }
  ngOnInit(): void {
    this.page.set(Page.create(1, this.pagesize));
    this.regist();
    this.load(1, this.args);
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
  private change = {
    inverse: (change: SimpleChange) => {
      if (change) {
        this.load(this.page().PageIndex, this.args);
      }
    },
  };

  private regist() {
    if (this._load) {
      this.subs.add(
        this._load.subscribe((x) => {
          let index = x.first ? 1 : this.page().PageIndex;
          this.selected = undefined;
          this.selectedChange.emit(this.selected);
          this.load(index, this.args);
        }),
      );
    }
  }

  private load(index: number, args: SystemVideoDeviceListArgs) {
    this.business
      .load(args)
      .then((datas) => {
        this.loaded.emit(datas);
        this.source = datas;
        this.on.page(index);
      })
      .catch((e) => {
        this.error.emit(e);
      });
  }

  private filter(inverse: string[]) {
    return this.source.filter((x) => {
      return !inverse.includes(x.Id);
    });
  }

  on = {
    page: (index: number) => {
      let source = this.filter(this.inverse);
      let paged = PagedList.create(source, index, this.page().PageSize);
      if (paged.Data.length == 0 && paged.Page.PageIndex > 1) {
        this.on.page(paged.Page.PageIndex - 1);
        return;
      }

      this.page.set(paged.Page);
      this.datas.set(paged.Data);
    },
    select: (e: Event, item: VideoChannel) => {
      if (this.selected == item) {
        e.stopPropagation();
        return;
      }
      this.selected = item;
      this.selectedChange.emit(item);
    },
    dblclick: (e: Event, item: VideoChannel) => {
      e.stopPropagation();
      this.itemdblclick.emit(item);
    },
  };
}
