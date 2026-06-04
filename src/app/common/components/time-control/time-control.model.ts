export class TimeModel {
  [key: string]: any;

  constructor(time?: Date);
  constructor(hour: number, minute: number, second: number);
  constructor(time?: Date | number, minute?: number, second?: number) {
    if (time === undefined) {
      time = new Date();
    }
    if (time instanceof Date) {
      this.hour = new ViewValue(
        time.getHours(),
        TimeModel.format(time.getHours())
      );
      this.minute = new ViewValue(
        time.getMinutes(),
        TimeModel.format(time.getMinutes())
      );
      this.second = new ViewValue(
        time.getSeconds(),
        TimeModel.format(time.getSeconds())
      );
    } else {
      this.hour = new ViewValue(time, TimeModel.format(time));
      this.minute = new ViewValue(minute!, TimeModel.format(minute!));
      this.second = new ViewValue(second!, TimeModel.format(second!));
    }
  }
  hour: ViewValue<number> = new ViewValue(0, '00');
  minute: ViewValue<number> = new ViewValue(0, '00');
  second: ViewValue<number> = new ViewValue(0, '00');

  toDate(date?: Date) {
    if (date) {
      date = new Date(date.getTime());
    } else {
      date = new Date();
    }
    date.setHours(this.hour.value);
    date.setMinutes(this.minute.value);
    date.setSeconds(this.second.value);
    return date;
  }

  static format(num: number) {
    if (num < 10) {
      return `0${num}`;
    }
    return num.toString();
  }
}

class ViewValue<T> {
  constructor(value: T, view: string) {
    this.view = view;
    this.value = value;
  }
  view: string;
  value: T;
}

export class TimeDurationModel {
  constructor(begin: Date, end: Date) {
    this.begin = new TimeModel(begin);
    this.end = new TimeModel(end);
  }
  begin: TimeModel;
  end: TimeModel;
}
