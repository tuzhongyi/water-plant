const name = {
  hour: 'hour',
  minute: 'minute',
  second: 'second',
  millisecond: 'millisecond',
};
export class Time {
  constructor(time?: string);
  constructor(time?: Time);
  constructor(
    hour?: number,
    minute?: number,
    second?: number,
    millisecond?: number
  );

  constructor(
    time: string | number | Time = 0,
    minute: number = 0,
    second: number = 0,
    millisecond?: number
  ) {
    if (typeof time === 'string') {
      let dot = time.indexOf('.');
      if (dot >= 0) {
        let millisecond = time.substring(dot + 1);
        this.millisecond = parseInt(millisecond);
        time = time.substring(0, dot);
      }
      let times = time.split(':');
      for (let i = 0; i < times.length; i++) {
        switch (i) {
          case 0:
            this.hour = parseInt(times[i]);
            break;
          case 1:
            this.minute = parseInt(times[i]);
            break;
          case 2:
            this.second = parseInt(times[i]);
            break;

          default:
            break;
        }
      }
    } else if (time instanceof Time) {
      this.hour = time.hour;
      this.minute = time.minute;
      this.second = time.second;
      this.millisecond = time.millisecond;
    } else if (
      typeof time === 'object' &&
      name.hour in time &&
      name.minute in time &&
      name.second in time
    ) {
      this.hour = time[name.hour];
      this.minute = time[name.minute];
      this.second = time[name.second];
      if (name.millisecond in time) {
        this.millisecond = time[name.millisecond];
      }
    } else {
      this.hour = time;
      this.minute = minute;
      this.second = second;
      this.millisecond = millisecond;
    }
  }
  hour: number = 0;
  minute: number = 0;
  second: number = 0;
  millisecond?: number;

  toMinutes() {
    return this.hour * 60 + this.minute;
  }

  toSeconds() {
    return (
      this.hour * 60 * 60 +
      this.minute * 60 +
      this.second +
      (this.millisecond ?? 0) / 1000
    );
  }

  toDate() {
    let date = new Date(
      this.hour * 60 * 60 * 1000 +
        this.minute * 60 * 1000 +
        this.second * 1000 +
        (this.millisecond ?? 0) / 1000
    );
    // let date = new Date();
    // date.setHours(this.hour, this.minute, this.second);
    return date;
  }
  toString(millisecond = false) {
    let hour = this.hour.toString().padStart(2, '0');
    let minute = this.minute.toString().padStart(2, '0');
    let second = this.second.toString().padStart(2, '0');

    let str = `${hour}:${minute}:${second}`;

    if (millisecond && this.millisecond !== undefined) {
      let milliseconds = Math.floor(this.millisecond)
        .toString()
        .padStart(3, '0');
      str += `.${milliseconds}`;
    }
    return str;
  }

  static from = {
    seconds: (seconds: number, floor = true) => {
      let hour = Math.floor(seconds / 3600);
      let minute = Math.floor((seconds % 3600) / 60);
      let second = seconds % 60;
      if (floor) {
        second = Math.floor(second);
      }

      return new Time(hour, minute, second);
    },
    milliseconds: (value: number) => {
      let seconds = Math.floor(value / 1000);
      let hour = Math.floor(seconds / 3600);
      let minute = Math.floor((seconds % 3600) / 60);
      let second = seconds % 60;

      let millisecond = value % 1000;

      return new Time(hour, minute, second, millisecond);
    },
  };
}
