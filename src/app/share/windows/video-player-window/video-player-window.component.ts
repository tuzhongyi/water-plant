import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { TimeControlComponent } from '../../../common/components/time-control/time-control.component';
import {
  TimeDurationModel,
  TimeModel,
} from '../../../common/components/time-control/time-control.model';
import { VideoPlayerComponent } from '../../../common/components/video-player/video-player.component';
import { PlayMode, VideoModel } from '../../../common/components/video-player/video-player.model';
import { WindowComponent } from '../../../common/components/window-control/window.component';
import {
  DateTimePickerDirective,
  DateTimePickerView,
} from '../../../common/directives/date-time-picker/date-time-picker.directive';
import { DateTimeTool } from '../../../common/tools/date-time-tool/datetime.tool';
import { VideoPlayerWindowBusiness } from './video-player-window.business';

@Component({
  selector: 'howell-video-player-window',
  imports: [CommonModule, DateTimePickerDirective, TimeControlComponent, VideoPlayerComponent],
  templateUrl: './video-player-window.component.html',
  styleUrls: ['./video-player-window.component.less'],
  providers: [VideoPlayerWindowBusiness],
})
export class VideoPlayerWindowComponent
  extends WindowComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() cameraId?: string;
  @Input() mode: PlayMode = PlayMode.live;
  @Input() begin?: Date;
  @Input() end?: Date;
  @Input() autoplay: boolean = false;
  @Input() subtitle = false;
  @Input() index = 255;

  constructor(private business: VideoPlayerWindowBusiness) {
    super();
    this.business = business;
    let duration = DateTimeTool.beforeOrAfter(this.date, 15);
    this.duration = new TimeDurationModel(duration.begin, duration.end);
  }
  ngOnDestroy(): void {
    this.data = undefined;
  }

  PlayMode = PlayMode;
  date: Date = new Date();
  duration: TimeDurationModel;
  data?: VideoModel;
  DateTimePickerView = DateTimePickerView;
  stop: EventEmitter<void> = new EventEmitter();

  ngOnChanges(changes: SimpleChanges): void {
    if ('begin' in changes) {
      if (this.begin) {
        this.duration.begin = new TimeModel(this.begin);
        this.date = this.begin;
      }
    }
    if ('end' in changes) {
      this.duration.end = new TimeModel(this.end);
    }
    if (this.mode === PlayMode.live) {
      this.autoplay = true;
    }
    if (this.autoplay) {
      this.loadData();
    }
  }

  async loadData() {
    if (this.cameraId) {
      if (this.mode == PlayMode.live) {
        this.preview();
      } else {
        this.playback();
      }
    }
  }
  changeMode(mode: PlayMode) {
    this.mode = mode;
    if (mode == PlayMode.live) {
      this.preview();
    } else {
      this.stop.emit();
      let duration = DateTimeTool.beforeOrAfter(this.date, 15);
      this.duration = new TimeDurationModel(duration.begin, duration.end);
    }
  }
  async preview() {
    this.mode = PlayMode.live;
    if (this.cameraId) {
      this.data = await this.business.load(this.cameraId, this.mode);
    }
  }
  webUrl?: string;
  async playback() {
    this.mode = PlayMode.vod;
    let duration = {
      begin: this.duration.begin.toDate(this.date),
      end: this.duration.end.toDate(this.date),
    };
    if (this.cameraId) {
      this.data = await this.business.load(this.cameraId, this.mode, duration);
    }
  }
}
