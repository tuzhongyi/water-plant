import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { wait } from '../../tools/wait';
import { TimeModel } from './time-control.model';

declare let $: any;

@Component({
  selector: 'app-time-control',
  imports: [CommonModule, FormsModule],
  templateUrl: './time-control.component.html',
  styleUrls: ['./time-control.component.less'],
})
export class TimeControlComponent implements OnChanges, OnInit, AfterViewInit {
  @Input() model: TimeModel = new TimeModel();
  @Output() modelChange: EventEmitter<TimeModel> = new EventEmitter();
  @Input() beginModel?: TimeModel;

  @Input() endModel?: TimeModel;

  @Input() time: Date = new Date();
  @Output() timeChange: EventEmitter<Date> = new EventEmitter();
  @Input() begin?: Date;
  @Input() end?: Date;
  @Input() disabled?: boolean = false;

  constructor() {}

  @ViewChild('hour')
  hour?: ElementRef;

  @ViewChild('minute')
  minute?: ElementRef;

  @ViewChild('second')
  second?: ElementRef;

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

  ngAfterViewInit(): void {
    wait(() => {
      return !!this.hour;
    }).then(() => {
      this.wheel(this.hour!.nativeElement);
      (this.hour!.nativeElement as HTMLInputElement).addEventListener('input', (e: any) => {
        let value = this.oninput(e);
        if (value !== undefined) {
          this.model.hour.value = value;
          this.model.hour.view = value.toString().padStart(2, '0');
          this.modelChange.emit(this.model);
          this.time.setHours(value);
          this.timeChange.emit(this.time);
        }
      });
    });
    wait(() => {
      return !!this.minute;
    }).then(() => {
      this.wheel(this.minute!.nativeElement);
      (this.minute!.nativeElement as HTMLInputElement).addEventListener('input', (e: any) => {
        let value = this.oninput(e);
        if (value !== undefined) {
          this.model.minute.value = value;
          this.model.minute.view = value.toString().padStart(2, '0');
          this.modelChange.emit(this.model);
          this.time.setMinutes(value);
          this.timeChange.emit(this.time);
        }
      });
    });
    wait(() => {
      return !!this.second;
    }).then(() => {
      this.wheel(this.second!.nativeElement);
      (this.second!.nativeElement as HTMLInputElement).addEventListener('input', (e: any) => {
        let value = this.oninput(e);
        if (value !== undefined) {
          this.model.second.value = value;
          this.model.second.view = value.toString().padStart(2, '0');
          this.modelChange.emit(this.model);
          this.time.setSeconds(value);
          this.timeChange.emit(this.time);
        }
      });
    });
  }

  ngOnInit(): void {}

  wheel(element: HTMLInputElement) {
    $(element).each((index: number, element: HTMLElement) => {
      if (!element.onwheel) {
        element.onwheel = (event: any) => {
          event.preventDefault();
          let input = event.currentTarget as HTMLInputElement;
          let $this = $(event.currentTarget);
          let $inc = parseFloat($this.attr('step'));
          let $max = parseFloat($this.attr('max'));
          let $min = parseFloat($this.attr('min'));
          let $currVal = parseFloat($this.val());
          let { hour, minute, second } = this.model;

          if (this.endModel) {
            // 如果是开始时间组件,max不能超过结束时间
            if (Array.from(input.classList).includes('hour')) {
              $max = this.endModel.hour.value;
            }
            if (
              Array.from(input.classList).includes('minute') &&
              hour.value == this.endModel.hour.value
            ) {
              $max = this.endModel.minute.value;
            }
            if (
              Array.from(input.classList).includes('second') &&
              hour.value == this.endModel.hour.value &&
              minute.value == this.endModel.minute.value
            ) {
              $max = this.endModel.second.value;
            }
          } else if (this.beginModel) {
            // 如果是结束时间组件,min不能小于开始时间
            if (Array.from(input.classList).includes('hour')) {
              $min = this.beginModel.hour.value;
            }
            if (
              Array.from(input.classList).includes('minute') &&
              hour.value == this.beginModel.hour.value
            ) {
              $min = this.beginModel.minute.value;
            }
            if (
              Array.from(input.classList).includes('second') &&
              hour.value == this.beginModel.hour.value &&
              minute.value == this.beginModel.minute.value
            ) {
              $min = this.beginModel.second.value;
            }
          }

          // If blank, assume value of 0
          if (isNaN($currVal)) {
            $currVal = 0.0;
          }
          let value = $min;

          // Increment or decrement numeric based on scroll distance
          if (event.deltaY > 0) {
            if ($currVal + $inc <= $max) {
              value = $currVal + $inc;
            }
          } else {
            if ($currVal - $inc >= $min) {
              value = $currVal - $inc;
            } else {
              // 零时刻回退
              value = $max;
            }
          }
          let view = TimeControlComponent.format(value);
          // $this.val(view);

          let array = ['hour', 'minute', 'second'];

          for (let i = 0; i < array.length; i++) {
            const element = array[i];
            if (input.classList.contains(array[i])) {
              this.model[array[i]].value = value;
              this.model[array[i]].view = view;
              this.modelChange.emit(this.model);
              let date = new Date(this.time.getTime());
              date.setHours(
                this.model.hour.value,
                this.model.minute.value,
                this.model.second.value,
              );
              this.timeChange.emit(date);
              break;
            }
          }

          if (this.endModel) {
            if (Array.from(input.classList).includes('hour')) {
              //当前hour的值小于结束时间时，分钟和秒是无限制的，但等于结束时间时需要校准，不得超过结束时间
              if (value == this.endModel.hour.value) {
                minute.value =
                  minute.value > this.endModel.minute.value
                    ? this.endModel.minute.value
                    : minute.value;
                second.value =
                  second.value > this.endModel.second.value
                    ? this.endModel.second.value
                    : second.value;
                let mview = TimeControlComponent.format(minute.value);
                let sview = TimeControlComponent.format(second.value);
                minute.view = mview;
                second.view = sview;
              }
            }
            if (
              Array.from(input.classList).includes('minute') &&
              hour.value == this.endModel.hour.value
            ) {
              if (value == this.endModel.minute.value) {
                second.value =
                  second.value > this.endModel.second.value
                    ? this.endModel.second.value
                    : second.value;
                let sview = TimeControlComponent.format(second.value);
                second.view = sview;
              }
            }
          } else if (this.beginModel) {
            if (Array.from(input.classList).includes('hour')) {
              //当前hour的值大于开始时间时，分钟和秒是无限制的，但等于开始时间时需要校准，不得小于开始时间
              if (value == this.beginModel.hour.value) {
                minute.value =
                  minute.value < this.beginModel.minute.value
                    ? this.beginModel.minute.value
                    : minute.value;
                second.value =
                  second.value < this.beginModel.second.value
                    ? this.beginModel.second.value
                    : second.value;
                let mview = TimeControlComponent.format(minute.value);
                let sview = TimeControlComponent.format(second.value);
                minute.view = mview;
                second.view = sview;
              }
            }
            if (
              Array.from(input.classList).includes('minute') &&
              hour.value == this.beginModel.hour.value
            ) {
              if (value == this.beginModel.minute.value) {
                second.value =
                  second.value < this.beginModel.second.value
                    ? this.beginModel.second.value
                    : second.value;
                let sview = TimeControlComponent.format(second.value);
                second.view = sview;
              }
            }
          }
        };
      }
    });
  }

  oninput(e: Event) {
    if (e.target) {
      let value = (e.target as HTMLInputElement).value;
      let int = parseInt(value);
      (e.target as HTMLInputElement).value = TimeModel.format(int);
      return int;
    }
    return undefined;
  }

  private static format(num: number) {
    if (num < 10) {
      return `0${num}`;
    }
    return num.toString();
  }
}
