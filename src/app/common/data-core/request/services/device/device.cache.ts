import { Device } from '../../../models/devices/device.model';
import { IService } from '../../cache/cache.interface';
import { ServiceCache } from '../../cache/service.cache';
import { GetDevicesParams } from './device.params';

export class DeviceServiceCache extends ServiceCache<Device> {
  constructor(key: string, service: IService<Device>) {
    super(key, service, Device);
  }

  override filter(datas: Device[], params: GetDevicesParams): Device[] {
    if (params.Ids && params.Ids.length > 0) {
      datas = datas.filter((x) => params.Ids!.includes(x.Id));
    }
    if (params.Name) {
      datas = datas.filter((x) => x.Name.includes(params.Name!));
    }
    if (params.Host) {
      datas = datas.filter((x) => x.Host === params.Host);
    }
    if (params.ProtocolType) {
      datas = datas.filter((x) => x.ProtocolType === params.ProtocolType);
    }
    if (params.DeviceType !== undefined) {
      datas = datas.filter((x) => x.DeviceType === params.DeviceType);
    }
    if (params.SerialNumber) {
      datas = datas.filter((x) => x.SerialNumber === params.SerialNumber);
    }
    if (params.AlarmReceived !== undefined) {
      datas = datas.filter((x) => x.AlarmReceived === params.AlarmReceived);
    }
    if (params.SyncTime !== undefined) {
      datas = datas.filter((x) => x.SyncTime === params.SyncTime);
    }
    if (params.DeviceState !== undefined) {
      datas = datas.filter((x) => x.DeviceState === params.DeviceState);
    }
    return datas;
  }
}
