import { NameValue } from '../../common/data-core/models/capabilities/enum-name-value.model';

export class DeviceState {
  online = new NameValue(0, '在线设备');
  offline = new NameValue(0, '离线设备');
}
