export class Language {
  static Year = 'yyyy年';
  static Month = 'MM月';
  static Day = 'dd日';

  static month = 'M月';
  static day = 'd日';
  static year_month = `${this.Year}${this.month}`;
  static year_month_day = `${this.Year}${this.month}${this.day}`;

  static yyyy = 'yyyy';
  static MM = 'MM';
  static dd = 'dd';

  static HH = "HH'";
  static mm = 'mm';
  static ss = 'ss';

  static HHmmss = `${this.HH}:${this.mm}:${this.ss}`;
  static HHmm = `${this.HH}:${this.mm}`;
  static HHmm_ = `${this.HHmm}'`;

  static yyyyMMdd = `${this.yyyy}-${this.MM}-${this.dd}`;
  static yyyyMMddHHmmss = `${this.yyyyMMdd} ${this.HHmmss}`;
  static yyyyMMddHHmm = `${this.yyyyMMdd} ${this.HHmm_}`;

  static YearMonth = `${this.Year}${this.Month}`;
  static YearMonthDay = `${this.Year}${this.Month}${this.Day}`;
  static MonthDay = `${this.Month}${this.Day}`;

  static YearMonthDayHHmmss = `${this.YearMonthDay} ${this.HHmmss}`;
  static MonthDayHHmmss = `${this.MonthDay} ${this.HHmmss}`;

  static Week(day: number, format: string = '周') {
    let name = ['日', '一', '二', '三', '四', '五', '六', '日'];
    return `${format}${name[day]}`;
  }
}
