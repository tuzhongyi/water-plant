import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { CardStatisticComponent } from '../../../../common/components/card-statistic/card-statistic.component';
import { InputIconComponent } from '../../../../common/components/input-icon/input-icon.component';
import { VideoChannelViewGroup } from '../../../../common/data-core/models/devices/video-channel-view-group.model';
import { ConfigRequestService } from '../../../../common/data-core/request/config/config-request.service';
import { SystemVideoViewGroupBusiness } from '../business/system-video-view-group.business';
import { SystemVideoViewGroupArgs } from '../business/system-video-view-group.model';
import { SystemVideoViewGroupListComponent } from '../system-video-view-group-list/system-video-view-group-list.component';

@Component({
  selector: 'hw-system-video-view-group-manager',
  imports: [
    CommonModule,
    CardStatisticComponent,
    InputIconComponent,
    SystemVideoViewGroupListComponent,
  ],
  templateUrl: './system-video-view-group-manager.component.html',
  styleUrl: './system-video-view-group-manager.component.less',
  providers: [SystemVideoViewGroupBusiness],
})
export class SystemVideoViewGroupManagerComponent implements OnInit, OnDestroy {
  @Input() load?: EventEmitter<void>;
  @Input() create?: EventEmitter<VideoChannelViewGroup>;
  @Input() selected?: VideoChannelViewGroup;
  @Output() selectedChange = new EventEmitter<VideoChannelViewGroup>();
  @Output() play = new EventEmitter<VideoChannelViewGroup>();
  @Output() delete = new EventEmitter<VideoChannelViewGroup>();
  @Output() update = new EventEmitter<VideoChannelViewGroup>();
  @Input() minimizeable = false;
  @Input() minimize = false;
  @Output() minimizeChange = new EventEmitter<boolean>();

  constructor(
    private business: SystemVideoViewGroupBusiness,
    private config: ConfigRequestService,
  ) {
    this.config.get().then((x) => {
      this.loop.interval = x.video.loop * 1000;
    });
  }

  private subs = new Subscription();

  ngOnInit(): void {
    this.regist();
  }
  ngOnDestroy(): void {
    this.loop.stop();
    this.subs.unsubscribe();
  }

  private regist() {
    if (this.load) {
      this.subs.add(
        this.load.subscribe(() => {
          this.list.load.emit(this.list.args);
        }),
      );
    }
    if (this.create) {
      this.subs.add(
        this.create.subscribe((data) => {
          data.Sort = this.list.datas.length + 1;
          this.business.save(data).then((x) => {
            this.on.search();
          });
        }),
      );
    }
  }

  list = {
    datas: [] as VideoChannelViewGroup[],
    args: {} as SystemVideoViewGroupArgs,
    load: new EventEmitter<SystemVideoViewGroupArgs>(),
    on: {
      play: (item: VideoChannelViewGroup) => {
        this.loop.stop();
        this.play.emit(item);
      },
      update: (item: VideoChannelViewGroup) => {
        this.update.emit(item);
      },
      delete: (item: VideoChannelViewGroup) => {
        this.delete.emit(item);
      },
      select: (item: VideoChannelViewGroup) => {
        this.selected = item;
        this.selectedChange.emit(this.selected);
        this.loop.index = this.list.datas.findIndex((x) => x.Id == this.selected?.Id);
      },

      loaded: (datas: VideoChannelViewGroup[]) => {
        this.list.datas = datas;
      },
    },
  };

  loop = {
    ing: false,
    interval: 60 * 1000,
    handle: undefined as any,
    index: 0,
    start: () => {
      if (this.loop.ing) return;
      this.loop.ing = true;
      this.loop.next();
    },
    stop: () => {
      this.loop.ing = false;
      if (this.loop.handle !== undefined) {
        clearTimeout(this.loop.handle);
        this.loop.handle = undefined;
      }
    },
    next: () => {
      let datas = this.list.datas;
      if (datas.length === 0) {
        this.loop.stop();
        return;
      }
      if (this.loop.index >= datas.length) {
        this.loop.index = 0;
      }
      this.play.emit(datas[this.loop.index]);
      this.loop.index++;
      this.loop.handle = setTimeout(() => {
        this.loop.next();
      }, this.loop.interval);
    },
  };

  on = {
    search: () => {
      this.list.load.emit(this.list.args);
    },
    minimize: () => {
      if (!this.minimizeable) return;
      this.minimize = !this.minimize;
      this.minimizeChange.emit(this.minimize);
    },

    sort: (value: number) => {
      let selected = this.selected;
      if (!selected) return;

      let datas = this.list.datas;
      let index = datas.findIndex((x) => x.Id == selected.Id);
      if (index < 0) return;

      let target = index + value;
      if (target < 0 || target >= datas.length) return;

      let current = datas[index];
      let next = datas[target];
      let sort = current.Sort;
      current.Sort = next.Sort;
      next.Sort = sort;

      Promise.all([this.business.update(current), this.business.update(next)]).then(() => {
        this.on.search();
      });
    },
    loop: () => {
      if (this.loop.ing) {
        this.loop.stop();
      } else {
        this.loop.start();
      }
    },
  };
}
