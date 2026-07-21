import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlarmComponent } from '../../common/components/alarm-control/alarm.component';
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
import { VideoPlayerListComponent } from '../../share/video/video-player-list/video-player-list.component';
import { SystemMainElementManagerComponent } from '../system-main-element/system-main-element-manager/system-main-element-manager.component';
import { SystemMainRecordManagerComponent } from '../system-main-record/system-main-record-manager/system-main-record-manager.component';
import { SystemMainStateDeviceComponent } from '../system-main-state/system-main-state-device/system-main-state-device.component';
import { SystemMainThreeConfigManagerComponent } from '../system-main-three/system-main-three-config/system-main-three-config-manager/system-main-three-config-manager.component';
import { SystemMainThreeManager } from '../system-main-three/system-main-three-manager/system-main-three-manager';
import { SystemRecordManagerComponent } from '../system-record/system-record-manager/system-record-manager.component';
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
    AlarmComponent,
    VideoPlayerContainerComponent,
    SystemMainThreeManager,
    SystemMainStateDeviceComponent,
    SystemMainRecordManagerComponent,
    VideoPlayerListComponent,
    SystemMainElementManagerComponent,
    SystemMainThreeConfigManagerComponent,
    SystemRecordManagerComponent,
  ],
  templateUrl: './system-main.html',
  styleUrl: './system-main.less',
  providers: SystemMainDeviceBusinessProviders,
})
export class SystemMainComponent implements OnInit, OnDestroy {
  constructor(
    private business: SystemMainBusiness,
    private mqtt: MqttRequestService,
    private cdr: ChangeDetectorRef,
  ) {
    // this.window.config.three.show = true;
  }

  window = new SystemMainWindow();
  private subs = new Subscription();

  data = {
    device: {
      datas: [] as Device[],
    },
    db31: {
      datas: [] as DB31Device[],
    },
  };

  ngOnInit(): void {
    this.regist();
    this.load();
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private load() {
    this.business.device.load().then((x) => {
      this.data.device.datas = x;
      this.mqtt.load(x);
    });
    this.business.db31.load().then((x) => {
      this.data.db31.datas = x;
    });
  }

  private regist() {
    this.subs.add(
      this.mqtt.event.subscribe((x) => {
        let id = x.Resource?.ResourceId || x.DeviceId;
        switch (x.EventType) {
          case 1:
          case 103:
          case 104:
            break;
          case 2:
            this.map.alarm.emit(id);
            break;
          default:
            this.map.alarm.emit(id);
            this.window.alarm.open(x);
            break;
        }

        this.cdr.detectChanges();
      }),
    );
  }

  map = {
    alarm: new EventEmitter<string>(),
    on: {
      preview: (data: GeoMapElement) => {
        this.video.single.preview(data);
      },
      video: (datas: GeoMapElement[]) => {
        this.video.multple.preview(datas);
      },
    },
  };

  record = {
    on: {
      playback: (data: DeviceEventRecord) => {
        this.video.single.playback(data);
      },
    },
  };

  on = {
    test: () => {
      let str = `{
 "Id": "6a55fc3994557c65c44bcb41",
 "EventTime": "2026-07-14T17:07:05.558+08:00",
 "BeginTime": "2026-07-14T17:07:05.558+08:00",
 "EndTime": "2026-07-14T17:07:05.558+08:00",
 "Description": "<222 3F市场部>运动侦测报警",
 "EventType": 101,
 "EventDescription": "VMD",
 "DeviceId": "00310101030000000000002000000000",
 "DeviceName": "222.1",
 "TriggerType": 1,
 "Resource": {
 "ResourceId": "00310101030000000000002001000009",
 "ResourceType": 1,
 "ResourceName": "222 3F电梯厅",
 "ChannelNo": 9
 }
 }`;
      let x = JSON.parse(str);
      let id = x.Resource?.ResourceId || x.DeviceId;
      this.map.alarm.emit(id);
    },
    video: {},
  };

  video = {
    multple: {
      preview: (datas: GeoMapElement[]) => {
        this.window.video.multiple.open(datas);
      },
    },
    single: {
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
