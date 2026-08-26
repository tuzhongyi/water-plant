import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CardStatistic2Component } from '../../../common/components/card-statistic-2/card-statistic-2.component';
import {
  IVideoPlayerArgs,
  PreviewArgs,
} from '../../../share/video/video-player-content/video-player-content.model';
import { VideoPlayerListComponent } from '../../../share/video/video-player-list/video-player-list.component';
import { ScreenMode } from '../../../share/video/video-player-list/video-player-list.model';

@Component({
  selector: 'hw-system-video-player',
  imports: [CommonModule, CardStatistic2Component, VideoPlayerListComponent],
  templateUrl: './system-video-player.component.html',
  styleUrl: './system-video-player.component.less',
})
export class SystemVideoPlayerComponent implements OnInit, OnDestroy {
  @Input() preview?: EventEmitter<PreviewArgs>;

  constructor() {}

  private subs = new Subscription();

  ngOnInit(): void {
    this.regist();
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private regist() {
    if (this.preview) {
      this.subs.add(
        this.preview.subscribe((args) => {
          this.player.on.preview(args);
        }),
      );
    }
  }

  player = {
    Mode: ScreenMode,
    mode: ScreenMode.four,
    index: 0,
    preview: new EventEmitter<IVideoPlayerArgs[]>(),
    on: {
      mode: (value: ScreenMode) => {
        this.player.mode = value;
      },
      preview: (args: PreviewArgs) => {
        let datas = new Array(this.player.mode);
        datas[this.player.index] = args;
        this.player.preview.emit(datas);
      },
    },
  };
}
