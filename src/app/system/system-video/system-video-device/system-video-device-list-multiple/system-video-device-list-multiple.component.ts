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
  /**	通道 DeviceId → 父设备名称：悬停提示要显示「父设备 / 当前名称」 */
  deviceNames = signal<Record<string, string>>({});
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
        this.device.load(this.source);
      })
      .catch((e) => {
        this.error.emit(e);
      });
  }

  /** 悬停提示：第一行父设备名称，第二行当前（通道）名称；设备名查不到时只显示通道名称 */
  title(item: VideoChannel): string {
    let device = this.deviceNames()[item.DeviceId];
    return device ? `${device}\n${item.Name}` : item.Name;
  }

  private device = {
    /** 把当前列表涉及到的设备名称查出来（设备接口有缓存，同一个设备只请求一次） */
    load: async (datas: VideoChannel[]) => {
      let ids = Array.from(new Set(datas.map((x) => x.DeviceId).filter((x) => !!x)));
      if (ids.length == 0) return;
      let names = await Promise.all(ids.map((id) => this.business.deviceName(id)));
      let result: Record<string, string> = {};
      ids.forEach((id, index) => {
        if (names[index]) result[id] = names[index];
      });
      this.deviceNames.set(result);
    },
  };

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
