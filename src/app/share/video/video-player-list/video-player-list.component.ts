import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';

import { CommonModule, formatDate } from '@angular/common';
import { Subscription } from 'rxjs';
import { VideoChannelViewGroup } from '../../../common/data-core/models/devices/video-channel-view-group.model';
import { VideoChannelView } from '../../../common/data-core/models/devices/video-channel-view.model';
import { Language } from '../../../common/tools/language-tool/language';
import { VideoPlayerContentComponent } from '../video-player-content/video-player-content.component';
import {
  IVideoPlayerArgs,
  PlaybackArgs,
  PreviewArgs,
} from '../video-player-content/video-player-content.model';
import { ScreenMode, VideoPlayerListItem } from './video-player-list.model';

@Component({
  selector: 'howell-video-player-list',
  imports: [CommonModule, VideoPlayerContentComponent],
  templateUrl: './video-player-list.component.html',
  styleUrls: ['./video-player-list.component.less'],
})
export class VideoPlayerListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() mode = ScreenMode.one;
  @Input() play?: EventEmitter<IVideoPlayerArgs[]>;
  @Input() seek?: EventEmitter<number>;
  @Input() stop?: EventEmitter<number>;
  @Input() index: number = 0;
  @Output() indexChange = new EventEmitter<number>();

  @Output() playing = new EventEmitter<number>();
  @Output() stoping = new EventEmitter<number>();

  @Input() getviewgroup?: EventEmitter<(e: VideoChannelViewGroup) => void>;

  constructor(private cdr: ChangeDetectorRef) {}

  datas: VideoPlayerListItem[] = [];

  ScreenMode = ScreenMode;
  private subs = new Subscription();

  ngOnChanges(changes: SimpleChanges): void {
    this.change.mode(changes['mode']);

    if (changes['mode']) {
      this.initScreens();
      // if (this.mode > ScreenMode.one && this.index != 0) {
      //   this.datas[0].stop();
      // }
    }
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngOnInit(): void {
    this.initScreens();
    this.registEvent();
  }

  private change = {
    mode: (change: SimpleChange) => {
      if (change) {
        this.initScreens();
      }
    },
  };

  initModeOne() {
    let current = this.datas[this.index];
    if (!current) {
      current = new VideoPlayerListItem(0);
    }
    this.index = 0;
    this.indexChange.emit(this.index);
    this.datas = [current];
  }
  initModelMore() {
    let temps = this.datas;
    this.datas = [];
    for (let i = 0; i < this.mode; i++) {
      let old = temps.find((x) => x.index == i);
      if (old && old.playing) {
        this.datas.push(old);
      } else {
        this.datas.push(new VideoPlayerListItem(i));
      }
    }
    if (this.index >= this.mode) {
      this.index = this.mode - 1;
      this.indexChange.emit(this.index);
    } else {
      let current = this.datas.find((x) => x.selected);
      if (current) {
        this.index = current.index;
        this.indexChange.emit(this.index);
      }
    }
  }

  initScreens() {
    if (this.mode == ScreenMode.one) {
      this.initModeOne();
    } else {
      this.initModelMore();
    }
    for (let i = 0; i < this.datas.length; i++) {
      this.datas[i].selected = this.index === i;
    }
    this.cdr.detectChanges();
  }

  registEvent() {
    if (this.seek) {
      this.subs.add(
        this.seek.subscribe((x) => {
          if (this.datas.length > this.index) {
            this.datas[this.index].seek.emit(x);
          }
        }),
      );
    }
    if (this.play) {
      let sub = this.play.subscribe((datas) => {
        datas.map((args, index) => {
          this.mode = this.get.screen(datas.length);
          this.initScreens();

          if (this.datas.length > index) {
            if (args instanceof PreviewArgs) {
              this.datas[index].preview(args);
            } else if (args instanceof PlaybackArgs) {
              this.datas[index].playback(args);
            } else {
              throw new Error('Invalid args type');
            }
          }
        });
      });
      this.subs.add(sub);
    }
    if (this.stop) {
      let sub = this.stop.subscribe((index) => {
        this.datas[index].stop();
      });
      this.subs.add(sub);
    }
    if (this.getviewgroup) {
      this.subs.add(
        this.getviewgroup.subscribe((callback) => {
          callback(this.get.viewgroup());
        }),
      );
    }
  }

  private get = {
    screen: (length: number) => {
      const n = Math.ceil(Math.sqrt(length));
      return n * n;
    },
    viewgroup: (): VideoChannelViewGroup => {
      let group = new VideoChannelViewGroup();
      group.Name = formatDate(new Date(), Language.yyyyMMddHHmmss, 'en');
      group.Sort = 1;
      group.ViewNumber = this.mode;
      group.Views = [];
      this.datas.forEach((item, index) => {
        if (!item.playing) {
          return;
        }
        let args = item.args;
        if (args) {
          let view = new VideoChannelView();
          view.ViewNo = index + 1;
          view.VideoChannelId = args.cameraId;
          view.VideoChannelName = args.cameraName ?? '';
          view.StreamType = args.stream;
          group.Views.push(view);
        }
      });
      return group;
    },
  };

  onscreenclicked(index: number) {
    this.index = this.datas.findIndex((x) => x.index == index);
    this.datas.forEach((x) => {
      x.selected = x.index == this.index;
    });
    this.indexChange.emit(this.index);
  }
  onstop(index: number) {
    this.datas[index].stop();
    this.stoping.emit(index);
  }

  onplaying(index: number) {
    this.playing.emit(index);
  }
}
