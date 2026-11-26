import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlarmComponent } from '../../../common/components/alarm-control/alarm.component';
import { CardComponent } from '../../../common/components/card/card.component';
import { PlayMode } from '../../../common/components/video-player/video-player.model';
import { WindowComponent } from '../../../common/components/window-control/window.component';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { IDevice } from '../../../common/data-core/models/common/device.interface';
import { DB31Device } from '../../../common/data-core/models/db31/db31-device.model';
import { Device } from '../../../common/data-core/models/devices/device.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { DeviceEventRecord } from '../../../common/data-core/models/events/device-event-record.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import {
  Mqtt,
  MqttRequestService,
} from '../../../common/data-core/request/services/mqtt/mqtt.service';
import { DateTimeTool } from '../../../common/tools/date-time-tool/datetime.tool';
import { ElementStateTool } from '../../../common/tools/element-state-tool/element-state.tool';
import { HtmlTool } from '../../../common/tools/html-tool/html.tool';
import { PermissionTool } from '../../../common/tools/permission-tool/permission.tool';
import { wait } from '../../../common/tools/wait';
import { VideoPlayerContainerComponent } from '../../../share/video/video-player-container/video-player-container.component';
import { PreviewArgs } from '../../../share/video/video-player-content/video-player-content.model';
import { VideoPlayerListComponent } from '../../../share/video/video-player-list/video-player-list.component';
import { SystemDeviceChannelManagerComponent } from '../../system-device/system-device-channel-manager/system-device-channel-manager.component';
import { SystemDeviceManagerComponent } from '../../system-device/system-device-manager/system-device-manager.component';
import { SystemElementManagerComponent } from '../../system-element/system-element-manager/system-element-manager.component';
import { SystemRecordManagerComponent } from '../../system-record/system-record-manager/system-record-manager.component';
import { SystemMainRecordManagerComponent } from '../system-main-record/system-main-record-manager/system-main-record-manager.component';
import { SystemMainStateDeviceComponent } from '../system-main-state/system-main-state-device/system-main-state-device.component';
import { SystemMainThreeConfigManagerComponent } from '../system-main-three/system-main-three-config/system-main-three-config-manager/system-main-three-config-manager.component';
import { SystemMainThreeManager } from '../system-main-three/system-main-three-manager/system-main-three-manager';
import { SystemMainThreeSource } from '../system-main-three/system-main-three.source';
import {
  SystemMainBusiness,
  SystemMainDeviceBusinessProviders,
} from './business/system-main.business';
import { SystemMainWindow } from './system-main.window';

@Component({
  selector: 'hw-system-main',
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    WindowComponent,
    AlarmComponent,
    VideoPlayerContainerComponent,
    SystemMainThreeManager,
    SystemMainStateDeviceComponent,
    SystemMainRecordManagerComponent,
    VideoPlayerListComponent,
    SystemElementManagerComponent,
    SystemMainThreeConfigManagerComponent,
    SystemRecordManagerComponent,
    SystemDeviceManagerComponent,
    SystemDeviceChannelManagerComponent,
  ],
  templateUrl: './system-main.component.html',
  styleUrl: './system-main.component.less',
  providers: [...SystemMainDeviceBusinessProviders, SystemMainThreeSource],
})
export class SystemMainComponent implements OnInit, OnDestroy {
  constructor(
    private business: SystemMainBusiness,
    private mqtt: MqttRequestService,
    private cdr: ChangeDetectorRef,
  ) {}

  @ViewChild('card') mapcontainer?: CardComponent;
  private permission = inject(PermissionTool);
  private elementstate = inject(ElementStateTool);
  window = new SystemMainWindow();
  private handle = {
    loop: undefined as any,
  };
  private subs = new Subscription();

  data = {
    all: signal<IDevice[]>([]),
    device: signal<Device[]>([]),
    db31: signal<DB31Device[]>([]),
  };

  ngOnInit(): void {
    this.init();
    this.regist();
    this.load();
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
    clearInterval(this.handle.loop);
  }

  private init() {
    this.mqtt.load();
    this.handle.loop = setInterval(() => {
      this.load().then((x) => {
        this.map.load.emit();
      });
    }, 60 * 1000);
  }

  private load() {
    let loaded = [false, false];
    this.business.device
      .load()
      .then((x) => {
        this.data.device.set(x);

        this.data.all.set([...x, ...this.data.db31()]);
      })
      .finally(() => {
        loaded[0] = true;
      });
    this.business.db31
      .load()
      .then((x) => {
        this.data.db31.set(x);

        this.data.all.set([...this.data.device(), ...x]);
      })
      .finally(() => {
        loaded[1] = true;
      });

    return wait(() => {
      return !loaded.some((x) => !x);
    });
  }

  private regist() {
    this.subs.add(
      Mqtt.event.subscribe((x) => {
        let id = x.Resource?.ResourceId || x.DeviceId;
        switch (x.EventType) {
          case 1:
            this.map.load.emit();
            this.record.load.emit();
            break;
          // case 103:
          // case 104:
          //   this.map.load.emit();
          //   this.record.load.emit();
          //   this.map.alarm.emit(id);
          // break;
          case 2:
            this.map.alarm.emit(id);
            this.map.load.emit();
            this.record.load.emit();
            break;
          default:
            switch (x.TriggerType) {
              case 3:
                if (x.Resource?.ResourceId) {
                  this.business.element.get(x.Resource?.ResourceId).then((x) => {
                    if (x) {
                      this.map.unalarm.emit(x);
                    }
                  });
                }

                this.map.load.emit();
                this.record.load.emit();
                this.window.table.element.reload.emit();
                break;

              default:
                this.map.alarm.emit(id);
                /*  没有视频预览权限、或记录里没有当前用户可查看的通道时不弹报警预览窗口，
                    地图报警和列表照常刷新；弹窗里也不会出现无权限的通道 */
                let record = this.permission.preview ? this.alarm.channel(x) : undefined;
                if (record) {
                  this.window.alarm.open(record, true);
                }
                this.map.load.emit();
                this.record.load.emit();
                this.window.table.element.reload.emit();
                break;
            }

            break;
        }

        this.cdr.detectChanges();
      }),
    );
  }

  /**	报警弹窗只播放当前用户有权限查看的通道：
      过滤 Actions / Resource 后返回记录副本，没有可播放通道时返回 undefined（不弹窗） */
  private alarm = {
    channel: (data: DeviceEventRecord): DeviceEventRecord | undefined => {
      let actions = (data.Actions ?? []).filter((x) =>
        this.permission.canChannel(x.ResourceId),
      );
      let resource =
        data.Resource && this.permission.canChannel(data.Resource.ResourceId)
          ? data.Resource
          : undefined;
      if (actions.length == 0 && !resource) return undefined;
      let record = Object.assign(new DeviceEventRecord(), data);
      record.Actions = actions;
      record.Resource = resource;
      return record;
    },
  };

  map = {
    load: new EventEmitter<void>(),
    alarm: new EventEmitter<string>(),
    unalarm: new EventEmitter<GeoMapElement>(),
    expandscreen: signal<boolean>(false),
    on: {
      preview: (data: GeoMapElement) => {
        this.video.single.preview(data);
      },
      video: (datas: GeoMapElement[]) => {
        this.video.multple.preview(datas);
      },
      element: (args: {
        type?: MapElementType;
        state?: number;
        buildingId?: string;
        ids?: string[];
      }) => {
        this.window.table.element.type = args.type;
        this.window.table.element.state = args.state;
        this.window.table.element.buildingId = args.buildingId;
        this.window.table.element.ids = args.ids;
        this.window.table.element.show.set(true);
      },
      resetstate: (data: GeoMapElement) => {
        /* 与元素列表里的「重置状态」按钮一致：没有报警设置/控制权限不能复位 */
        if (!this.permission.alarm) return;
        /*	离线点位不能复位：复位只清报警，无法改变设备离线，容易导致点位状态和真实设备不一致 */
        this.elementstate.state(data).then((state) => {
          if (state === 1) return;
          this.business.element.reset(data.Id).then((x) => {
            this.map.unalarm.emit(data);
            this.window.table.element.reload.emit();
            /*	复位后主页数据也要立即刷新：报警列表、地图点位/统计、左侧设备状态 */
            this.record.load.emit();
            this.map.load.emit();
            this.load();
          });
        });
      },
      expandscreen: (value: boolean) => {
        this.map.expandscreen.set(value);
      },
      fullscreen: (value: boolean) => {
        HtmlTool.screen.set.fullscreen(value, this.mapcontainer?.element?.nativeElement);
      },
    },
  };

  record = {
    load: new EventEmitter<void>(),
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
 "ResourceId": "00310101030000000000002001000006",
 "ResourceType": 1,
 "ResourceName": "222 3F电梯厅",
 "ChannelNo": 6
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
        if (!this.permission.preview) return;
        /* 只播放当前用户有权限查看的通道 */
        let allowed = datas.filter((x) => this.permission.canChannel(x.ElementId));
        if (allowed.length == 0) return;
        this.window.video.multiple.open(allowed);
      },
    },
    single: {
      preview: (data: GeoMapElement | VideoChannel) => {
        if (!this.permission.preview) return;
        if (data instanceof GeoMapElement) {
          if (!this.permission.canChannel(data.ElementId)) return;
          this.window.video.single.title = data.Name;
          this.window.video.single.autoplay = true;
          this.window.video.single.cameraId = data.ElementId;
          this.window.video.single.mode = PlayMode.live;
          this.window.video.single.show.set(true);
        } else if (data instanceof VideoChannel) {
          if (!this.permission.canChannel(data.Id)) return;
          this.window.video.single.title = data.Name;
          this.window.video.single.autoplay = true;
          this.window.video.single.cameraId = data.Id;
          this.window.video.single.mode = PlayMode.live;
          this.window.video.single.show.set(true);
        }
      },
      playback: (data: DeviceEventRecord) => {
        if (!this.permission.playback) return;
        this.window.video.single.mode = PlayMode.vod;

        /*	只回放当前用户有权限查看的通道：联动动作、报警资源都先按通道权限过滤，
            否则会播出记录里无权限的那一路视频 */
        let actions = (data.Actions ?? []).filter((x) =>
          this.permission.canChannel(x.ResourceId),
        );
        let resource =
          data.Resource && this.permission.canChannel(data.Resource.ResourceId)
            ? data.Resource
            : undefined;

        let title = '';
        let cameraId = '';
        if (actions.length > 0) {
          let names = actions.map((x) => x.ResourceName ?? x.DeviceName ?? '').filter((x) => !!x);
          title = names.join(' | ');
          cameraId = actions[0].ResourceId ?? '';
        }
        if (!title) {
          title = resource?.ResourceName || data.DeviceName || '';
        }
        if (!cameraId) {
          cameraId = resource?.ResourceId || '';
        }
        /* 没有可回放的通道（例如设备在线/离线记录）时不打开播放器 */
        if (!cameraId) return;
        this.window.video.single.title = title;
        let duration = DateTimeTool.before(data.EventTime);
        this.window.video.single.begin = duration.begin;
        this.window.video.single.end = duration.end;
        this.window.video.single.cameraId = cameraId;
        this.window.video.single.autoplay = true;
        this.window.video.single.show.set(true);
      },
    },
  };

  channel = {
    preview: (data: PreviewArgs) => {
      if (!this.permission.preview) return;
      if (!this.permission.canChannel(data.cameraId)) return;
      this.window.video.single.title = data.cameraName || '';
      this.window.video.single.autoplay = true;
      this.window.video.single.cameraId = data.cameraId;
      this.window.video.single.mode = PlayMode.live;
      this.window.video.single.show.set(true);
    },
  };
}
