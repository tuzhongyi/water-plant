import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { VideoPlayerContentComponent } from '../video-player-content/video-player-content.component';
import {
  PlaybackArgs,
  PreviewArgs,
  VideoPlayerArgs,
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
  @Input() play?: EventEmitter<VideoPlayerArgs[]>;
  @Input() seek?: EventEmitter<number>;
  @Input() index: number = 0;
  @Output() indexChange = new EventEmitter<number>();

  @Output() playing = new EventEmitter<number>();
  @Output() stoping = new EventEmitter<number>();

  constructor(private cdr: ChangeDetectorRef) {}

  datas: VideoPlayerListItem[] = [];

  ScreenMode = ScreenMode;
  private subs = new Subscription();

  ngOnChanges(changes: SimpleChanges): void {
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

  initModeOne() {
    let current = this.datas[this.index];
    if (!current) {
      current = new VideoPlayerListItem(0);
    }
    this.index = 0;
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
    } else {
      let current = this.datas.find((x) => x.selected);
      if (current) {
        this.index = current.index;
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
  }

  private get = {
    screen: (length: number) => {
      const n = Math.ceil(Math.sqrt(length));
      return n * n;
    },
  };

  onscreenclicked(index: number) {
    this.index = this.datas.findIndex((x) => x.index == index);
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
