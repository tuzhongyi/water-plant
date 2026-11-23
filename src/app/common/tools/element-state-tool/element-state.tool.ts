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
      ElementState 是 0（正常）或 2（报警）时直接使用；
      ElementState 为 1（离线）或 undefined 时，不能只信元素自身的状态：
      按 ElementId 查绑定设备的实际状态，设备在线就按在线显示，设备确实离线才显示离线：
      - DB31 元素：通道 → 设备的 DeviceState；
      - 其他元素：按 ElementId 查视频通道，用 ChannelState；
      查不到设备时沿用元素自身的 ElementState（undefined 由调用方按离线显示）	*/
  async state(data: GeoMapElement): Promise<number | undefined> {
    if (data.ElementState === 0 || data.ElementState === 2) {
      return data.ElementState;
    }
    if (!data.ElementId) {
      return data.ElementState;
    }
    let devicestate: number | undefined;
    if (data.FromDB31) {
      devicestate = await this.from.db31(data.ElementId);
    } else {
      devicestate = await this.from.video(data.ElementId);
    }
    if (devicestate !== undefined) {
      return devicestate;
    }
    return data.ElementState;
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
