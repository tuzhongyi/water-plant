import { DateTimeFullTool } from './date-time-full.tool';
import { DateTimeAllTool } from './datetime-all.tool';
import { DateTimeLastTool } from './datetime-last.tool';
import { DateTimeMathTool } from './datetime-math.tool';
import { Duration } from './duration.model';

export class DateTimeTool {
  static last = new DateTimeLastTool();
  static all = new DateTimeAllTool();
  static math = new DateTimeMathTool();
  static full = new DateTimeFullTool();

  static beforeOrAfter(date: Date, seconds: number = 30): Duration {
    let duration = {
      begin: new Date(),
      end: new Date(),
    };

    let begin = new Date(date.getTime());
    begin.setSeconds(begin.getSeconds() - seconds);
    duration.begin = new Date(begin.getTime());

    let end = new Date(date.getTime());
    end.setSeconds(end.getSeconds() + seconds);
    duration.end = end;

    return duration;
  }
  static second(date: Date, before: number, after: number): Duration {
    let duration = {
      begin: new Date(date.getTime()),
      end: new Date(date.getTime()),
    };
    duration.begin.setSeconds(duration.begin.getSeconds() + before);
    duration.end.setSeconds(duration.end.getSeconds() + after);
    return duration;
  }
  static before(date: Date, seconds: number = 30): Duration {
    let duration = {
      begin: new Date(),
      end: new Date(date.getTime()),
    };

    let begin = new Date(date.getTime());
    begin.setSeconds(begin.getSeconds() - seconds);
    duration.begin = new Date(begin.getTime());

    return duration;
  }
  static beforeDay(date: Date, day: number = 7): Duration {
    let duration = {
      begin: new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - day
      ),
      end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
    };
    duration.end.setMilliseconds(-1);
    return duration;
  }
}
