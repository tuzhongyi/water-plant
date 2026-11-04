import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { WheelInputNumberDirective } from '../../directives/wheel-input-number/wheel-input-number.directive';
import { TimeModel } from './time-control.model';

@Component({
  selector: 'app-time-control',
  imports: [WheelInputNumberDirective],
  templateUrl: './time-control.component.html',
  styleUrls: ['./time-control.component.less'],
})
export class TimeControlComponent implements OnChanges {
  @Input() model: TimeModel = new TimeModel();
  @Output() modelChange: EventEmitter<TimeModel> = new EventEmitter();
  @Input() beginModel?: TimeModel;

  @Input() endModel?: TimeModel;

  @Input() time: Date = new Date();
  @Output() timeChange: EventEmitter<Date> = new EventEmitter();
  @Input() begin?: Date;
  @Input() end?: Date;
  @Input() disabled?: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['time']) {
      this.model = new TimeModel(changes['time'].currentValue);
    }
    if (changes['begin']) {
      this.beginModel = new TimeModel(changes['begin'].currentValue);
    }
    if (changes['end']) {
      this.endModel = new TimeModel(changes['end'].currentValue);
    }
  }

  /**	各输入框的上下限：开始时间不能超过结束时间，结束时间不能小于开始时间 */
  get limits() {
    let hour = {
      min: this.beginModel ? this.beginModel.hour.value : 0,
      max: this.endModel ? this.endModel.hour.value : 23,
    };
    let minute = {
      min:
        this.beginModel && this.model.hour.value == this.beginModel.hour.value
          ? this.beginModel.minute.value
          : 0,
      max:
        this.endModel && this.model.hour.value == this.endModel.hour.value
          ? this.endModel.minute.value
          : 59,
    };
    let second = {
      min:
        this.beginModel &&
        this.model.hour.value == this.beginModel.hour.value &&
        this.model.minute.value == this.beginModel.minute.value
          ? this.beginModel.second.value
          : 0,
      max:
        this.endModel &&
        this.model.hour.value == this.endModel.hour.value &&
        this.model.minute.value == this.endModel.minute.value
          ? this.endModel.second.value
          : 59,
    };
    return { hour, minute, second };
  }

  on = {
    change: (field: 'hour' | 'minute' | 'second', value: number, input: HTMLInputElement) => {
      let limit = this.limits[field];
      /*	滚轮已经按上下限取值；这里再收敛一次，处理直接键入的越界值 */
      let current = Math.min(Math.max(value, limit.min), limit.max);

      this.model[field].value = current;
      this.model[field].view = TimeModel.format(current);
      /* 输入框显示两位，和原来的时间显示一致 */
      input.value = this.model[field].view;

      /* 小时/分钟到达开始或结束时间的边界时，后面的值也要一起收敛 */
      this.adjust();

      this.modelChange.emit(this.model);
      this.timeChange.emit(this.model.toDate(this.time));
    },
  };

  /**	校准分钟和秒：小时（或分钟）到达开始/结束边界后，后面的值不能越界 */
  private adjust() {
    let { hour, minute, second } = this.model;
    if (this.endModel && hour.value == this.endModel.hour.value) {
      if (minute.value > this.endModel.minute.value) {
        minute.value = this.endModel.minute.value;
      }
      if (minute.value == this.endModel.minute.value && second.value > this.endModel.second.value) {
        second.value = this.endModel.second.value;
      }
    } else if (this.beginModel && hour.value == this.beginModel.hour.value) {
      if (minute.value < this.beginModel.minute.value) {
        minute.value = this.beginModel.minute.value;
      }
      if (
        minute.value == this.beginModel.minute.value &&
        second.value < this.beginModel.second.value
      ) {
        second.value = this.beginModel.second.value;
      }
    }
    hour.view = TimeModel.format(hour.value);
    minute.view = TimeModel.format(minute.value);
    second.view = TimeModel.format(second.value);
  }
}
