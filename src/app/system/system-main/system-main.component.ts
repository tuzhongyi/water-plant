import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CardComponent } from '../../common/components/card/card.component';
import { WindowComponent } from '../../common/components/window-control/window.component';
import { NameValue } from '../../common/data-core/models/capabilities/enum-name-value.model';
import { VideoChannel } from '../../common/data-core/models/devices/video-channel.model';
import { VideoPlayerWindowComponent } from '../../share/windows/video-player-window/video-player-window.component';
import { SystemMainPanel } from '../system-main-panel/system-main-panel';
import { SystemMainThreeManager } from '../system-main-three/system-main-three-manager/system-main-three-manager';
import { SystemMainVideoChannelBusiness } from './business/system-main-video-channel.business';
import { SystemMainBusiness } from './business/system-main.business';
import { SystemMainWindow } from './system-main.window';

@Component({
  selector: 'hw-system-main',
  imports: [
    CommonModule,
    CardComponent,
    WindowComponent,
    VideoPlayerWindowComponent,
    SystemMainThreeManager,
    SystemMainPanel,
  ],
  templateUrl: './system-main.html',
  styleUrl: './system-main.less',
  providers: [SystemMainVideoChannelBusiness, SystemMainBusiness],
})
export class SystemMainComponent implements OnInit {
  constructor(private business: SystemMainBusiness) {}

  window = new SystemMainWindow();

  data = {
    device: {
      datas: [] as VideoChannel[],
      state: [] as NameValue<number>[],
    },
  };

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.business.load().then((x) => {
      this.data.device.datas = x;
      let state = this.business.device.state(x);
      this.data.device.state = [state.online, state.offline];
    });
  }

  on = {
    test: () => {
      if (this.data.device.datas.length > 0) {
        let device = this.data.device.datas[0];
        this.window.video.title = device.Name;
        this.window.video.autoplay = true;
        this.window.video.cameraId = device.DeviceId;
        this.window.video.show = true;
      }
    },
  };
}
