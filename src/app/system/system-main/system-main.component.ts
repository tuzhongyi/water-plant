import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CardComponent } from '../../common/components/card/card.component';
import { PlayMode } from '../../common/components/video-player/video-player.model';
import { WindowComponent } from '../../common/components/window-control/window.component';
import { DB31Device } from '../../common/data-core/models/db31/db31-device.model';
import { Device } from '../../common/data-core/models/devices/device.model';
import { DeviceEventRecord } from '../../common/data-core/models/events/device-event-record.model';
import { GeoMapElement } from '../../common/data-core/models/geographic/map-element.model';
import { MqttRequestService } from '../../common/data-core/request/services/mqtt/mqtt.service';
import { DateTimeTool } from '../../common/tools/date-time-tool/datetime.tool';
import { VideoPlayerContainerComponent } from '../../share/video/video-player-container/video-player-container.component';
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
    VideoPlayerContainerComponent,
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
  constructor(
    private business: SystemMainBusiness,
    private mqtt: MqttRequestService,
  ) {}

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
      this.mqtt.load(x);
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
        this.window.video.single.title = data.Name;
        this.window.video.single.autoplay = true;
        this.window.video.single.cameraId = data.ElementId;
        this.window.video.single.mode = PlayMode.live;
        this.window.video.single.show = true;
      },
      playback: (data: DeviceEventRecord) => {
        this.window.video.single.mode = PlayMode.vod;
        let name = data.Resource?.ResourceName || data.DeviceName || '';
        this.window.video.single.title = name;
        let duration = DateTimeTool.before(data.EventTime);
        this.window.video.single.begin = duration.begin;
        this.window.video.single.end = duration.end;
        this.window.video.single.cameraId = data.Resource?.ResourceId || data.DeviceId;
        this.window.video.single.autoplay = true;
        this.window.video.single.show = true;
      },
    },
  };
}
