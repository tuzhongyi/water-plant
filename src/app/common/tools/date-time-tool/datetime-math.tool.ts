import { Duration } from './duration.model';

export class DateTimeMathTool {
  in(time: Date, duration: Duration) {
    return time >= duration.begin && time <= duration.end;
  }
  equals = {
    day: (a: Date, b: Date) => {
      return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
      );
    },
  };
  than(time: Date, to: Date) {
    return time > to;
  }
}
