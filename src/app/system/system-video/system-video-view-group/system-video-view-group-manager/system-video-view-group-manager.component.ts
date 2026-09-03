import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { CardStatistic1Component } from '../../../../common/components/card-statistic-1/card-statistic-1.component';
import { InputIconComponent } from '../../../../common/components/input-icon/input-icon.component';
import { VideoChannelViewGroup } from '../../../../common/data-core/models/devices/video-channel-view-group.model';
import { SystemVideoViewGroupArgs } from '../business/system-video-view-group.model';
import { SystemVideoViewGroupListComponent } from '../system-video-view-group-list/system-video-view-group-list.component';

@Component({
  selector: 'hw-system-video-view-group-manager',
  imports: [
    CommonModule,
    CardStatistic1Component,
    InputIconComponent,
    SystemVideoViewGroupListComponent,
  ],
  templateUrl: './system-video-view-group-manager.component.html',
  styleUrl: './system-video-view-group-manager.component.less',
})
export class SystemVideoViewGroupManagerComponent implements OnInit, OnDestroy {
  @Input() load?: EventEmitter<void>;
  @Input() selected?: VideoChannelViewGroup;
  @Output() selectedChange = new EventEmitter<VideoChannelViewGroup>();
  @Output() play = new EventEmitter<VideoChannelViewGroup>();
  @Output() delete = new EventEmitter<VideoChannelViewGroup>();
  @Output() update = new EventEmitter<VideoChannelViewGroup>();

  constructor() {}

  private subs = new Subscription();

  ngOnInit(): void {
    this.regist();
  }
  ngOnDestroy(): void {
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
  }

  list = {
    args: {} as SystemVideoViewGroupArgs,
    load: new EventEmitter<SystemVideoViewGroupArgs>(),
    on: {
      play: (item: VideoChannelViewGroup) => {
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
      },
    },
  };

  on = {
    search: () => {
      this.list.load.emit(this.list.args);
    },
  };
}
