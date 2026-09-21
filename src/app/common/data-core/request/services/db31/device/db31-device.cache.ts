import { DB31Device } from '../../../../models/db31/db31-device.model';
import { DeviceEventRecord } from '../../../../models/events/device-event-record.model';
import { IService } from '../../../cache/cache.interface';
import { ServiceCache } from '../../../cache/service.cache';
import { Mqtt } from '../../mqtt/mqtt.service';
import { GetDB31DevicesParams } from './db31-device.params';

export class DB31DeviceServiceCache extends ServiceCache<DB31Device> {
  constructor(key: string, service: IService<DB31Device>) {
    super(key, service, DB31Device);
    this.regist();
    this.timeout = 60 * 1000;
  }

  /* ---- MQTT ---- */

  private regist(): void {
    /* 事件流与应用内的通道缓存都是唯一的，不需要退订 */
    Mqtt.event.subscribe((x) => {
      /* 只用在线(1) / 离线(2)，其余事件与通道状态无关 */
      switch (x.EventType) {
        case 1:
          this.setstate(x, 0);
          break;

        case 2:
          this.setstate(x, 1);
          break;

        default:
          break;
      }
    });
  }

  private setstate(e: DeviceEventRecord, state: number): void {
    const datas = this.load();
    /* 还没加载过就没有可更新的数据 */
    if (!datas) return;

    /* 事件带资源 id 时是通道级；没有资源时按设备级处理，该设备下的通道一起改 */

    let targets: DB31Device[] = datas.filter((x) => x.Id === e.DeviceId);

    targets.forEach((x) => {
      x.DeviceState = state;
    });
  }

  override filter(datas: DB31Device[], params: GetDB31DevicesParams): DB31Device[] {
    if (params.Ids && params.Ids.length > 0) {
      datas = datas.filter((x) => params.Ids!.includes(x.Id));
    }
    if (params.Name) {
      datas = datas.filter((x) => x.Name && x.Name.includes(params.Name!));
    }
    if (params.DeviceTypes && params.DeviceTypes.length > 0) {
      datas = datas.filter((x) => params.DeviceTypes!.includes(x.DeviceType));
    }
    if (params.DeviceState !== undefined) {
      datas = datas.filter((x) => x.DeviceState === params.DeviceState);
    }
    return datas;
  }
}
