import { inject, Injectable } from '@angular/core';
import { GeoMapElement } from '../../data-core/models/geographic/map-element.model';
import { DB31RequestService } from '../../data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../data-core/request/services/device/device.service';

/**	地图元素状态的统一口径：场景 marker、统计面板、元素列表共用，避免几处显示不一致	*/
@Injectable({
  providedIn: 'root',
})
export class ElementStateTool {
  private db31 = inject(DB31RequestService);
  private device = inject(DeviceRequestService);

  /**	元素实际状态：0-正常，1-离线，2-报警。
      报警（2）优先；其他状态（0/1/undefined）以绑定设备的实际状态为准：
      状态复位只清除报警，设备仍然离线时点位必须继续显示离线，不能因为元素接口返回 0 就变成在线：
      - DB31 元素：通道 → 设备的 DeviceState；
      - 其他元素：按 ElementId 查视频通道，用 ChannelState；
      查不到设备时沿用元素自身的 ElementState（undefined 由调用方按离线显示）	*/
  async state(data: GeoMapElement): Promise<number | undefined> {
    if (data.ElementState === 2) {
      return data.ElementState;
    }
    if (!data.ElementId) {
      return data.ElementState;
    }
    /* 下面统一走 deviceState；保留 ElementId 判断，避免无绑定设备的元素查设备 */
    let devicestate = await this.deviceState(data);
    if (devicestate !== undefined) {
      return devicestate;
    }
    return data.ElementState;
  }

  /**	绑定设备/通道的实际状态（0-正常，1-离线）；查不到时返回 undefined。
      复位后需要用它把服务端的 ElementState 同步回真实状态	*/
  async deviceState(data: GeoMapElement): Promise<number | undefined> {
    if (!data.ElementId) {
      return undefined;
    }
    if (data.FromDB31) {
      return this.from.db31(data.ElementId);
    }
    return this.from.video(data.ElementId);
  }

  private from = {
    /**	DB31 元素：通道 → 设备的 DeviceState */
    db31: async (elementId: string): Promise<number | undefined> => {
      try {
        let channel = await this.db31.channel.cache.get(elementId);
        if (!channel.DeviceId) {
          return undefined;
        }
        let device = await this.db31.device.cache.get(channel.DeviceId);
        return device.DeviceState;
      } catch (error) {
        return undefined;
      }
    },
    /**	摄像机：按 ElementId 查视频通道，用通道的 ChannelState（0-正常，1-离线） */
    video: async (elementId: string): Promise<number | undefined> => {
      try {
        let channel = await this.device.video.channel.cache.get(elementId);
        return channel.ChannelState;
      } catch (error) {
        return undefined;
      }
    },
  };

  /**	没有状态（undefined）同样按离线显示，不能算成在线	*/
  offline(state?: number): boolean {
    return state != 0 && state != 2;
  }

  /**	报警状态（只决定显示颜色，不触发报警业务）	*/
  alarm(state?: number): boolean {
    return state == 2;
  }
}
