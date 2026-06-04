import { Injectable } from '@angular/core';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { DeviceState } from '../system-main.model';
import { SystemMainVideoChannelBusiness } from './system-main-video-channel.business';

@Injectable()
export class SystemMainBusiness {
  constructor(private channel: SystemMainVideoChannelBusiness) {}

  async load() {
    return this.channel.load();
  }

  device = {
    state: (datas: VideoChannel[]) => {
      let state = new DeviceState();
      datas.forEach((x) => {
        if (x.ChannelState) {
          state.offline.Value++;
        } else {
          state.online.Value++;
        }
      });
      return state;
    },
  };
}
