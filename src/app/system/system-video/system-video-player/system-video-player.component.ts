import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { CardStatistic2Component } from '../../../common/components/card-statistic-2/card-statistic-2.component';
import { VideoChannelViewGroup } from '../../../common/data-core/models/devices/video-channel-view-group.model';
import { HtmlTool } from '../../../common/tools/html-tool/html.tool';
import {
  IVideoPlayerArgs,
  PlaybackArgs,
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
  @Input() screen = ScreenMode.four;
  @Output() screenChange = new EventEmitter<ScreenMode>();
  @Input() preview?: EventEmitter<PreviewArgs>;
  @Input() playback?: EventEmitter<PlaybackArgs>;

  @Input() expand = false;
  @Output() expandChange = new EventEmitter<boolean>();

  @Output('viewgroup') _viewgroup = new EventEmitter<VideoChannelViewGroup>();
  @Input() viewgroupable = false;
  @Input() grouppreview?: EventEmitter<PreviewArgs[]>;

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
          this.on.preview(args);
        }),
      );
    }
    if (this.playback) {
      this.subs.add(
        this.playback.subscribe((args) => {
          this.on.playback(args);
        }),
      );
    }
    if (this.grouppreview) {
      this.subs.add(
        this.grouppreview.subscribe((x) => {
          this.on.group(x);
        }),
      );
    }
  }

  on = {
    mode: (value: ScreenMode) => {
      this.screen = value;
      this.screenChange.emit(this.screen);
    },
    group: (array: PreviewArgs[]) => {
      for (let i = 0; i < this.screen; i++) {
        let index = array.findIndex((x) => x.index == i);
        if (index < 0) {
          this.player.stop.emit(i);
        }
      }

      let datas = new Array(this.screen);
      for (let i = 0; i < array.length; i++) {
        const args = array[i];
        if (args.index || args.index == 0) {
          datas[args.index] = args;
        }
      }
      this.player.play.emit(datas);
    },
    preview: (args: PreviewArgs) => {
      let datas = new Array(this.screen);
      datas[this.player.index] = args;
      this.player.play.emit(datas);
    },
    playback: (args: PlaybackArgs) => {
      let datas = new Array(this.screen);
      datas[this.player.index] = args;
      this.player.play.emit(datas);
    },
    fullscreen: () => {
      HtmlTool.screen.set.fullscreen(!this.fullscreen);
    },
    expand: () => {
      this.expand = !this.expand;
      this.expandChange.emit(this.expand);
      // this.layout.headerVisible.set(!this.expand);
    },
  };

  player = {
    index: 0,
    play: new EventEmitter<IVideoPlayerArgs[]>(),
    stop: new EventEmitter<number>(false),
    playing: [] as number[],
    on: {
      playing: (index: number) => {
        if (!this.player.playing.includes(index)) {
          this.player.playing.push(index);
        }
        this.viewgroup.disabled.set(this.player.playing.length == 0);
      },
      stoping: (index: number) => {
        let i = this.player.playing.indexOf(index);
        if (i >= 0) {
          this.player.playing.splice(i, 1);
        }
        this.viewgroup.disabled.set(this.player.playing.length == 0);
      },
    },
  };

  viewgroup = {
    disabled: signal<boolean>(true),
    get: new EventEmitter<(e: VideoChannelViewGroup) => void>(),
    on: () => {
      this.viewgroup.get.emit((e: VideoChannelViewGroup) => {
        this._viewgroup.emit(e);
      });
    },
  };
}
