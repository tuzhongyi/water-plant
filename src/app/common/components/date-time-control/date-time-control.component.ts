import { formatDate } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DateTimePickerDirective,
  DateTimePickerView,
} from '../../directives/date-time-picker/date-time-picker.directive';
import { Language } from '../../tools/language-tool/language';

@Component({
  selector: 'date-time-control',
  imports: [DateTimePickerDirective, FormsModule],
  templateUrl: './date-time-control.component.html',
  styleUrl: './date-time-control.component.less',
})
export class DateTimeControlComponent {
  @Input('format') format = Language.YearMonthDay;

  // @Input('changeDate') changeDate: (val: any) => void;
  @Input('startView') startView: DateTimePickerView = DateTimePickerView.month;
  @Input('minView') minView: DateTimePickerView = DateTimePickerView.month;
  @Input('week') week: boolean = false;
  @Input() disabled: boolean = false;
  @Input() zindex: number = 10;
  @Input() position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' =
    'bottom-right';

  private _date: Date = new Date();
  public get date(): Date {
    return this._date;
  }
  @Input('date')
  public set date(v: Date) {
    this._date = v;
  }

  @Input()
  public set value(v: number) {
    this._date = new Date(v);
  }
  public get value() {
    return this._date.getTime();
  }

  @Output() dateChange: EventEmitter<Date> = new EventEmitter();

  @ViewChild('element') element?: ElementRef<HTMLInputElement>;

  ondatechange(date: Date) {
    this.date = date;
    this.dateChange.emit(date);
    if (this.element) {
      this.element.nativeElement.value = formatDate(date, this.format, 'en');
    }
  }

  onchange(e: Event) {
    console.log(e);
  }
}
