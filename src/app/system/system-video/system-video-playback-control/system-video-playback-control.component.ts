import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardStatisticComponent } from '../../../common/components/card-statistic/card-statistic.component';
import { DateTimeControlComponent } from '../../../common/components/date-time-control/date-time-control.component';
import { TimeControlComponent } from '../../../common/components/time-control/time-control.component';
import { DateTimePickerView } from '../../../common/directives/date-time-picker/date-time-picker.directive';
import { DateTimeTool } from '../../../common/tools/date-time-tool/datetime.tool';
import { Duration } from '../../../common/tools/date-time-tool/duration.model';

@Component({
  selector: 'hw-system-video-playback-control',
  imports: [
    CommonModule,
    FormsModule,
    CardStatisticComponent,
    DateTimeControlComponent,
    TimeControlComponent,
  ],
  templateUrl: './system-video-playback-control.component.html',
  styleUrl: './system-video-playback-control.component.less',
})
export class SystemVideoPlaybackControlComponent {
  @Output() playback: EventEmitter<Duration> = new EventEmitter();

  DateTimePickerView = DateTimePickerView;

  date: Date = new Date();
  duration = DateTimeTool.before(this.date, 15 * 60 * 1000);

  constructor() {}

  on = {
    playback: () => {
      this.duration.begin.setFullYear(this.date.getFullYear());
      this.duration.begin.setMonth(this.date.getMonth());
      this.duration.begin.setDate(this.date.getDate());

      this.duration.end.setFullYear(this.date.getFullYear());
      this.duration.end.setMonth(this.date.getMonth());
      this.duration.end.setDate(this.date.getDate());

      this.playback.emit(this.duration);
    },
  };
}
