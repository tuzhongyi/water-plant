import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
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
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';
import { VideoPlayerContainerBusiness } from './video-player-container.business';

@Component({
  selector: 'howell-video-player-container',
  imports: [CommonModule, DateTimePickerDirective, TimeControlComponent, VideoPlayerComponent],
  templateUrl: './video-player-container.component.html',
  styleUrls: ['./video-player-container.component.less'],
  providers: [VideoPlayerContainerBusiness],
})
export class VideoPlayerContainerComponent
  extends WindowComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() cameraId?: string;
  @Input() mode: PlayMode = PlayMode.live;
  @Input() begin?: Date;
  @Input() end?: Date;
  @Input() autoplay: boolean = false;
  @Input() subtitle = false;
  @Input() index = 0;
  @Input('data') source?: VideoModel;

  constructor(
    private business: VideoPlayerContainerBusiness,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
  ) {
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
    this.change.time.begin(changes['begin']);
    this.change.time.begin(changes['end']);
    this.change.mode(changes['mode']);
    if (this.autoplay) {
      this.loadData();
    }
  }

  private change = {
    time: {
      begin: (change: SimpleChange) => {
        if (change) {
          if (this.begin) {
            this.duration.begin = new TimeModel(this.begin);
            this.date = this.begin;
          }
        }
      },
      end: (change: SimpleChange) => {
        if (change) {
          if (this.end) {
            this.duration.end = new TimeModel(this.end);
          }
        }
      },
    },
    mode: (change: SimpleChange) => {
      if (change) {
        if (this.mode === PlayMode.live) {
          this.autoplay = true;
        }
      }
    },
  };

  async loadData() {
    if (this.mode == PlayMode.live) {
      this.preview();
    } else {
      this.playback();
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

  webUrl?: string;

  preview() {
    if (this.cameraId) {
      this._.preview.camera(this.cameraId);
    }
    if (this.source) {
      this._.preview.source(this.source);
    }
  }
  playback() {
    if (this.cameraId) {
      this._.playback.camera(this.cameraId);
    }
    if (this.source) {
      this._.playback.source(this.source);
    }
  }

  private _ = {
    preview: {
      camera: async (cameraId: string) => {
        try {
          this.mode = PlayMode.live;
          this.data = await this.business.load(cameraId, this.mode);
          this.cdr.detectChanges();
        } catch (error) {
          this.toastr.error('获取视频链接失败');
        }
      },
      source: async (model: VideoModel) => {
        this.mode = PlayMode.live;
        this.data = ObjectTool.assign(model, VideoModel);
      },
    },

    playback: {
      camera: async (cameraId: string) => {
        try {
          this.mode = PlayMode.vod;
          let duration = {
            begin: this.duration.begin.toDate(this.date),
            end: this.duration.end.toDate(this.date),
          };
          this.data = await this.business.load(cameraId, this.mode, duration);
          this.cdr.detectChanges();
        } catch (error) {
          this.toastr.error('获取视频链接失败');
        }
      },
      source: async (model: VideoModel) => {
        if (!model.beginTime) {
          console.error('没有回放开始时间');
          this.toastr.error('没有回放开始时间');
          return;
        }
        if (!model.endTime) {
          console.error('没有回放结束时间');
          this.toastr.error('没有回放结束时间');
          return;
        }
        this.mode = PlayMode.vod;
        this.date = new Date(model.beginTime.getTime());
        this.duration.begin = new TimeModel(model.beginTime);
        this.duration.end = new TimeModel(model.endTime);
        this.data = ObjectTool.assign(model, VideoModel);
      },
    },
  };
}
