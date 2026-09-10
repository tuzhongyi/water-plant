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
import { VideoChannel } from '../../../../common/data-core/models/devices/video-channel.model';
import { Page } from '../../../../common/data-core/models/interface/page-list.model';
import { SystemVideoDeviceListBusiness } from '../system-video-device-list/system-video-device-list.business';
import { SystemVideoDeviceListArgs } from '../system-video-device-list/system-video-device-list.model';

@Component({
  selector: 'hw-system-video-device-list-multiple',
  imports: [CommonModule],
  templateUrl: './system-video-device-list-multiple.component.html',
  styleUrl: './system-video-device-list-multiple.component.less',
  providers: [SystemVideoDeviceListBusiness],
})
export class SystemVideoDeviceListMultipleComponent implements OnInit, OnChanges, OnDestroy {
  @Input() args: SystemVideoDeviceListArgs = {};
  @Input('load') _load?: EventEmitter<SystemVideoDeviceListArgs>;
  @Input() inverse: string[] = [];
  @Input() selected: VideoChannel[] = [];
  @Output() selectedChange = new EventEmitter<VideoChannel[]>();
  @Output() loaded = new EventEmitter<VideoChannel[]>();
  @Output() error = new EventEmitter<Error>();

  constructor(private business: SystemVideoDeviceListBusiness) {}

  source: VideoChannel[] = [];

  datas = signal<VideoChannel[]>([]);
  page = signal<Page>(Page.create(1, 12));
  private subs = new Subscription();

  ngOnChanges(changes: SimpleChanges): void {
    this.change.inverse(changes['inverse']);
  }
  ngOnInit(): void {
    this.regist();
    this.load(this.args);
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
  private change = {
    inverse: (change: SimpleChange) => {
      if (change) {
        this.load(this.args);
      }
    },
  };

  private regist() {
    if (this._load) {
      this.subs.add(
        this._load.subscribe((x) => {
          this.selected = [];
          this.selectedChange.emit(this.selected);
          this.load(this.args);
        }),
      );
    }
  }

  private load(args: SystemVideoDeviceListArgs) {
    this.business
      .load(args)
      .then((datas) => {
        this.loaded.emit(datas);
        this.source = datas;
        this.datas.set(this.source);
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

  /** 是否已选中（供 checkbox / 行高亮使用） */
  isSelected(item: VideoChannel): boolean {
    return this.selected.includes(item);
  }

  /** 切换单个条目的选中状态 */
  private toggle(item: VideoChannel): void {
    const next = new Set(this.selected);
    if (next.has(item)) {
      next.delete(item);
    } else {
      next.add(item);
    }
    this.selected = Array.from(next);
    this.selectedChange.emit(this.selected);
  }

  on = {
    select: (item: VideoChannel) => {
      this.toggle(item);
    },
    selectAll: () => {
      const next = new Set(this.selected);
      for (const item of this.datas()) {
        next.add(item);
      }
      this.selected = Array.from(next);
      this.selectedChange.emit(this.selected);
    },
    invert: () => {
      const next = new Set(this.selected);
      for (const item of this.datas()) {
        if (next.has(item)) {
          next.delete(item);
        } else {
          next.add(item);
        }
      }
      this.selected = Array.from(next);
      this.selectedChange.emit(this.selected);
    },
    clear: () => {
      this.selected = [];
      this.selectedChange.emit(this.selected);
    },
  };
}
