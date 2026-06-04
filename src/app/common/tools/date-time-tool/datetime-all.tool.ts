import { Duration, DurationUnit } from './duration.model';

export class DateTimeAllTool {
  unit(date: Date, unit: DurationUnit, opts?: { week?: number }) {
    switch (unit) {
      case DurationUnit.day:
        return this.day(date);
      case DurationUnit.week:
        return this.week(date, opts?.week);
      case DurationUnit.month:
        return this.month(date);
      case DurationUnit.year:
        return this.year(date);
      default:
        throw new Error("all unit don't support");
    }
  }
  year(date: Date): Duration {
    let duration = {
      begin: new Date(),
      end: new Date(),
    };
    duration.begin = new Date(date.getFullYear(), 0, 1);
    let next = new Date(duration.begin.getTime());
    next.setFullYear(next.getFullYear() + 1);
    next.setMilliseconds(-1);
    duration.end = next;
    return duration;
  }
  month(date: Date): Duration {
    let duration = {
      begin: new Date(),
      end: new Date(),
    };
    duration.begin = new Date(date.getFullYear(), date.getMonth(), 1);
    let next = new Date(duration.begin.getTime());
    next.setMonth(next.getMonth() + 1);
    next.setMilliseconds(-1);
    duration.end = next;
    return duration;
  }
  day(date: Date): Duration {
    let duration = {
      begin: new Date(),
      end: new Date(),
    };
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    duration.begin = new Date(year, month, day);
    let next = new Date(duration.begin.getTime());
    next.setDate(next.getDate() + 1);
    next.setMilliseconds(-1);
    duration.end = next;
    return duration;
  }
  week(date: Date, firstDay = 1): Duration {
    let duration = {
      begin: new Date(),
      end: new Date(),
    };
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    let weekDay = date.getDay() - firstDay;

    let begin = new Date(year, month, day);
    begin.setDate(begin.getDate() - weekDay);
    begin.toISOString;
    duration.begin = begin;
    let next = new Date(begin.getTime());
    next.setDate(next.getDate() + 7);
    next.setMilliseconds(-1);
    duration.end = next;
    return duration;
  }
}
