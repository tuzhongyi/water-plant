import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';

export enum SystemMainRecordTableEventType {
  device = 1,
  alarm = 2,
}
export class SystemMainRecordTableArgs {
  type?: SystemMainRecordTableEventType;
}
export interface SystemMainRecordTableItem {
  id: string;
  color: string;
  icon: string;
  time: string;
  type: string;

  name: string;
  description?: string;
  data: DeviceEventRecord;
  playback: boolean;
}
