import { inject, Injectable } from '@angular/core';
import { GeoMapElement } from '../../data-core/models/geographic/map-element.model';
import { DB31RequestService } from '../../data-core/request/services/db31/db31.service';

/**	地图元素状态的统一口径：场景 marker、统计面板、元素列表共用，避免几处显示不一致	*/
@Injectable({
  providedIn: 'root',
})
export class ElementStateTool {
  private db31 = inject(DB31RequestService);

  /**	元素实际状态：0-正常，1-离线，2-报警。
      ElementState 优先；DB31 元素（通道）自身不带状态，取不到时按以前的逻辑
      查绑定的父设备（通道 → 设备的 DeviceState）；
      非 DB31 或查不到设备时返回 undefined（调用方按离线显示）	*/
  async state(data: GeoMapElement): Promise<number | undefined> {
    if (data.ElementState !== undefined) {
      return data.ElementState;
    }
    if (!data.FromDB31 || !data.ElementId) {
      return undefined;
    }
    try {
      let channel = await this.db31.channel.cache.get(data.ElementId);
      if (!channel.DeviceId) {
        return undefined;
      }
      let device = await this.db31.device.cache.get(channel.DeviceId);
      return device.DeviceState;
    } catch (error) {
      return undefined;
    }
  }

  /**	没有状态（undefined）同样按离线显示，不能算成在线	*/
  offline(state?: number): boolean {
    return state != 0 && state != 2;
  }

  /**	报警状态（只决定显示颜色，不触发报警业务）	*/
  alarm(state?: number): boolean {
    return state == 2;
  }
}
