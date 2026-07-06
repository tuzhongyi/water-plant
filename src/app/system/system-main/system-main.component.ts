import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CardComponent } from '../../common/components/card/card.component';
import { WindowComponent } from '../../common/components/window-control/window.component';
import { DB31Device } from '../../common/data-core/models/db31/db31-device.model';
import { Device } from '../../common/data-core/models/devices/device.model';
import { GeoMapElement } from '../../common/data-core/models/geographic/map-element.model';
import { VideoPlayerWindowComponent } from '../../share/windows/video-player-window/video-player-window.component';
import { SystemMainPanel } from '../system-main-panel/system-main-panel';
import { SystemMainRecordManagerComponent } from '../system-main-record/system-main-record-manager/system-main-record-manager.component';
import { SystemMainStateDeviceComponent } from '../system-main-state/system-main-state-device/system-main-state-device.component';
import { SystemMainThreeManager } from '../system-main-three/system-main-three-manager/system-main-three-manager';
import {
  SystemMainBusiness,
  SystemMainDeviceBusinessProviders,
} from './business/system-main.business';
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
    SystemMainStateDeviceComponent,
    SystemMainRecordManagerComponent,
  ],
  templateUrl: './system-main.html',
  styleUrl: './system-main.less',
  providers: SystemMainDeviceBusinessProviders,
})
export class SystemMainComponent implements OnInit {
  constructor(private business: SystemMainBusiness) {}

  window = new SystemMainWindow();

  data = {
    device: {
      datas: [] as Device[],
    },
    db31: {
      datas: [] as DB31Device[],
    },
  };

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.business.device.load().then((x) => {
      this.data.device.datas = x;
    });
    this.business.db31.load().then((x) => {
      this.data.db31.datas = x;
    });
  }

  on = {
    test: () => {
      // if (this.data.device.datas.length > 0) {
      //   let device = this.data.device.datas[0];
      //   this.window.video.title = device.Name;
      //   this.window.video.autoplay = true;
      //   this.window.video.cameraId = device.DeviceId;
      //   this.window.video.show = true;
      // }
    },
    video: {
      preview: (data: GeoMapElement) => {
        this.window.video.title = data.Name;
        this.window.video.autoplay = true;
        this.window.video.cameraId = data.ElementId;
        this.window.video.show = true;
      },
    },
  };
}
