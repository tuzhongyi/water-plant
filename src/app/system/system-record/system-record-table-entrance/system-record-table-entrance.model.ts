import { DateTimeTool } from '../../../common/tools/date-time-tool/datetime.tool';
import { Duration } from '../../../common/tools/date-time-tool/duration.model';
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';

export interface ISystemRecordEntranceTableArgs {
  name?: string;
  type?: number;
  value?: string;
  duration: Duration;
}
export interface SystemRecordEntranceTableItem<T = any> {
  id: string;
  time: string;
  type: Promise<string>;
  description: string;
  name: string;
  value: string;
  color: string;
  playback: boolean;
  data: T;
}

export class SystemRecordEntranceTableArgs implements ISystemRecordEntranceTableArgs {
  name?: string;
  type?: number;
  value?: string;
  duration = DateTimeTool.last.month(new Date());
  first = false;
}

export class SystemRecordEntranceTableFilter implements ISystemRecordEntranceTableArgs {
  name?: string;
  type?: number;
  duration = DateTimeTool.all.day(new Date());
  value?: string;
  asc?: string;
  desc: string = 'EventTime';

  static from(args: SystemRecordEntranceTableArgs): SystemRecordEntranceTableFilter {
    let filter = ObjectTool.assign(args, SystemRecordEntranceTableFilter);
    return filter;
  }
}
