import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { CardStatistic2Component } from '../../../common/components/card-statistic-2/card-statistic-2.component';
import { VideoChannelViewGroup } from '../../../common/data-core/models/devices/video-channel-view-group.model';
import { HtmlTool } from '../../../common/tools/html-tool/html.tool';
import {
  IVideoPlayerArgs,
  PreviewArgs,
} from '../../../share/video/video-player-content/video-player-content.model';
import { VideoPlayerListComponent } from '../../../share/video/video-player-list/video-player-list.component';
import { ScreenMode } from '../../../share/video/video-player-list/video-player-list.model';
import { SystemLayoutService } from '../../component/system-layout.service';

@Component({
  selector: 'hw-system-video-player',
  imports: [CommonModule, CardStatistic2Component, VideoPlayerListComponent],
  templateUrl: './system-video-player.component.html',
  styleUrl: './system-video-player.component.less',
})
export class SystemVideoPlayerComponent implements OnInit, OnDestroy {
  @Input() preview?: EventEmitter<PreviewArgs>;
  @Input() getviewgroup?: EventEmitter<(e: VideoChannelViewGroup) => void>;
  @Input() expand = false;
  @Output() expandChange = new EventEmitter<boolean>();

  constructor(private layout: SystemLayoutService) {}

  private subs = new Subscription();

  get fullscreen() {
    return HtmlTool.screen.get.fullscreen();
  }

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
      fullscreen: () => {
        HtmlTool.screen.set.fullscreen(!this.fullscreen);
      },
      expand: () => {
        this.expand = !this.expand;
        this.expandChange.emit(this.expand);
        // this.layout.headerVisible.set(!this.expand);
      },
    },
  };
}
