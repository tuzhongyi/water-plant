import { VideoChannel } from '../../../models/devices/video-channel.model';
import { DeviceEventRecord } from '../../../models/events/device-event-record.model';
import { IService } from '../../cache/cache.interface';
import { ServiceCache } from '../../cache/service.cache';
import { Mqtt } from '../mqtt/mqtt.service';
import { GetVideoChannelsParams } from './device.params';

export class DeviceVideoChannelServiceCache extends ServiceCache<VideoChannel> {
  constructor(key: string, service: IService<VideoChannel>) {
    super(key, service, VideoChannel);
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

  /**
   * 把事件影响到的通道状态改成指定值
   * ChannelState：0-正常（在线），1-离线
   *
   * 直接改缓存里的对象，而不是让缓存失效：已经拿到数组的调用方也能立刻看到新状态
   */
  private setstate(e: DeviceEventRecord, state: number): void {
    const datas = this.load();
    /* 还没加载过就没有可更新的数据 */
    if (!datas) return;

    /* 事件带资源 id 时是通道级；没有资源时按设备级处理，该设备下的通道一起改 */
    const resourceId = e.Resource?.ResourceId;
    let targets: VideoChannel[];
    if (resourceId) {
      targets = datas.filter((x) => x.Id === resourceId);
    } else if (e.DeviceId) {
      targets = datas.filter((x) => x.DeviceId === e.DeviceId);
    } else {
      return;
    }

    targets.forEach((x) => {
      x.ChannelState = state;
    });
  }

  override filter(datas: VideoChannel[], params: GetVideoChannelsParams): VideoChannel[] {
    if (params.Ids && params.Ids.length > 0) {
      datas = datas.filter((x) => params.Ids!.includes(x.Id));
    }
    if (params.Name) {
      datas = datas.filter((x) => x.Name.includes(params.Name!));
    }
    if (params.AudioFormat) {
      datas = datas.filter((x) => x.AudioFormat === params.AudioFormat);
    }
    if (params.VideoFormat) {
      datas = datas.filter((x) => x.VideoFormat === params.VideoFormat);
    }
    if (params.PTZ !== undefined) {
      datas = datas.filter((x) => x.PTZ === params.PTZ);
    }
    if (params.Enabled !== undefined) {
      datas = datas.filter((x) => x.Enabled === params.Enabled);
    }
    if (params.ChannelState !== undefined) {
      datas = datas.filter((x) => x.ChannelState === params.ChannelState);
    }
    return datas;
  }

  override get(id: string): Promise<VideoChannel> {
    /* 先从缓存中查找，避免不必要的 HTTP 请求 */
    return this.all().then((datas) => {
      let index = datas.findIndex((x) => x.Id === id);
      if (index >= 0) {
        return datas[index];
      }

      throw new Error('未找到视频通道');
    });
  }
}
