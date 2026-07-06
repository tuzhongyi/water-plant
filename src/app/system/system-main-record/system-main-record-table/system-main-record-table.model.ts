import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';

export enum SystemMainRecordTableEventType {
  device = 1,
  other = 2,
}
export class SystemMainRecordTableArgs {
  type?: SystemMainRecordTableEventType;
}
export interface SystemMainRecordTableItem {
  id: string;
  color: string;
  icon: string;
  time: Date;
  type: string;

  name: string;
  description?: string;
  data: DeviceEventRecord;
}
