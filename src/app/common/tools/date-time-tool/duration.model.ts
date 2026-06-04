export interface Duration {
  begin: Date;
  end: Date;
}
export enum DurationUnit {
  second,
  minute,
  hour,
  day,
  week,
  month,
  year,
}
