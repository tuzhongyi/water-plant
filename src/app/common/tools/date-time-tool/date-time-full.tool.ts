import { Duration, DurationUnit } from './duration.model';

export class DateTimeFullTool {
  unit(
    date: Date,
    unit: DurationUnit,
    opts?: {
      week: { first: number };
    }
  ): Date[] {
    switch (unit) {
      case DurationUnit.day:
        return this.day(date);
      case DurationUnit.week:
        return this.week(date, opts?.week.first);
      case DurationUnit.month:
        return this.month(date);
      case DurationUnit.year:
        return this.year(date);

      default:
        return [];
    }
  }
  day(date: Date): Date[] {
    let dates: Date[] = [];
    let day = new Date(date.getTime());
    for (let i = 0; i < 24; i++) {
      let d = new Date(day.getTime());
      d.setHours(i, 0, 0, 0);
      dates.push(d);
    }
    return dates;
  }
  days(duration: Duration) {
    let dates: Date[] = [];
    let begin = new Date(
      duration.begin.getFullYear(),
      duration.begin.getMonth(),
      duration.begin.getDate()
    );
    let end = new Date(
      duration.end.getFullYear(),
      duration.end.getMonth(),
      duration.end.getDate()
    );
    for (
      let d = new Date(begin.getTime());
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      let day = new Date(d.getTime());
      day.setHours(0, 0, 0, 0);
      dates.push(day);
    }
    return dates;
  }
  week(date: Date, firstDay = 1): Date[] {
    let dates: Date[] = [];
    let day = new Date(date.getTime());
    let weekDay = day.getDay() - firstDay;
    if (weekDay < 0) {
      weekDay = weekDay + 7;
    }
    day.setDate(day.getDate() - weekDay);
    day.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      let d = new Date(day.getTime());
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }
  month(date: Date): Date[] {
    let dates: Date[] = [];
    let year = date.getFullYear();
    let month = date.getMonth();
    let d = new Date(year, month + 1, 0);
    let count = d.getDate();
    for (let i = 1; i <= count; i++) {
      let day = new Date(year, month, i);
      day.setHours(0, 0, 0, 0);
      dates.push(day);
    }
    return dates;
  }
  year(date: Date, all = true, current = true): Date[] {
    let dates: Date[] = [];
    let year = date.getFullYear();

    let last = 12;

    if (!all) {
      let today = new Date();
      if (year == today.getFullYear()) {
        if (current) {
          last = today.getMonth() + 1;
        } else {
          last = today.getMonth();
        }
      }
    }

    for (let i = 0; i < last; i++) {
      let month = new Date(year, i, 1);
      month.setHours(0, 0, 0, 0);
      dates.push(month);
    }
    return dates;
  }
}
