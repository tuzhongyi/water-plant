import { Duration } from './duration.model';

export class DateTimeThanTool {
  less = {
    /** 判断时间区间的跨度是否小于指定秒数 */
    second: (duration: Duration, seconds: number): boolean => {
      let span = (duration.end.getTime() - duration.begin.getTime()) / 1000;
      return span < seconds;
    },
    /** 判断时间区间的跨度是否小于指定月数 */
    month: (duration: Duration, months: number = 1): boolean => {
      let target = new Date(duration.begin);
      target.setMonth(target.getMonth() + months);
      return duration.end < target;
    },
    day: (duration: Duration, day = 0): boolean => {
      let target = new Date(duration.begin);
      target.setDate(target.getDate() + day);
      return duration.end < target;
    },
  };

  same = {
    day: (duration: Duration) => {
      return duration.begin.getDate() == duration.end.getDate();
    },
  };
  today(date: Date) {
    let now = new Date();
    return (
      date.getFullYear() == now.getFullYear() &&
      date.getMonth() == now.getMonth() &&
      date.getDate() == now.getDate()
    );
  }
}
