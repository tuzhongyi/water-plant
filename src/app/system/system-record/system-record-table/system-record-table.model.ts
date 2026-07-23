import { DateTimeTool } from '../../../common/tools/date-time-tool/datetime.tool';
import { Duration } from '../../../common/tools/date-time-tool/duration.model';
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';

export interface ISystemRecordTableArgs {
  name?: string;
  type?: number;
  value?: string;
  duration: Duration;
}
export interface SystemRecordTableItem<T = any> {
  id: string;
  time: string;
  type: Promise<string>;
  description: string;
  name: string;
  value: string;
  typecolor: string;
  trigger: Promise<string>;
  triggercolor: string;
  playback: boolean;
  data: T;
}

export class SystemRecordTableArgs implements ISystemRecordTableArgs {
  name?: string;
  type?: number;
  duration = DateTimeTool.last.month(new Date());
  first = false;
}

export class SystemRecordTableFilter implements ISystemRecordTableArgs {
  name?: string;
  type?: number;
  duration = DateTimeTool.all.day(new Date());
  asc?: string;
  desc?: string = 'EventTime';

  static from(args: SystemRecordTableArgs): SystemRecordTableFilter {
    let filter = ObjectTool.assign(args, SystemRecordTableFilter);
    return filter;
  }
}
