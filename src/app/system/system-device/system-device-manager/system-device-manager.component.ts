import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HowellSelectComponent } from '../../../common/components/hw-select/select-control.component';
import { IDevice } from '../../../common/data-core/models/common/device.interface';
import { DB31Device } from '../../../common/data-core/models/db31/db31-device.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { SystemDeviceChannelTableBusiness } from '../system-device-channel-table/system-device-channel-table.business';
import { SystemDeviceChannelTableComponent } from '../system-device-channel-table/system-device-channel-table.component';
import { SystemDeviceChannelTableArgs } from '../system-device-channel-table/system-device-channel-table.model';
import { SystemDeviceTableComponent } from '../system-device-table/system-device-table.component';
import {
  SystemDeviceTableArgs,
  SystemDeviceTableLoad,
} from '../system-device-table/system-device-table.model';
import { SystemDeviceSource } from '../system-device.source';

@Component({
  selector: 'hw-system-device-manager',
  imports: [
    CommonModule,
    FormsModule,
    HowellSelectComponent,
    SystemDeviceTableComponent,
    SystemDeviceChannelTableComponent,
  ],
  templateUrl: './system-device-manager.component.html',
  styleUrl: './system-device-manager.component.less',
  providers: [SystemDeviceSource, SystemDeviceChannelTableBusiness],
})
export class SystemDeviceManagerComponent implements OnChanges {
  @Input() state?: number;
  @Input() datas: IDevice[] = [];
  @Output() preview = new EventEmitter<VideoChannel>();
  constructor(
    public source: SystemDeviceSource,
    private channelBusiness: SystemDeviceChannelTableBusiness,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.change.state(changes['state']);
  }
  ngOnInit(): void {}

  private change = {
    state: (change: SimpleChange) => {
      if (change) {
        this.table.args.state = this.state;
      }
    },
  };

  table = {
    args: {} as SystemDeviceTableArgs,
    extra: [] as IDevice[],
    load: new EventEmitter<SystemDeviceTableLoad>(),
    on: {
      search: async () => {
        this.channel.clear.emit();
        this.channel.args = {
          state: this.table.args.state,
          name: this.table.args.name,
        };
        let exclusive = this.table.args.type != undefined || !!this.table.args.host;
        if (exclusive) {
          this.table.extra = [];
        } else {
          let channels = await this.channelBusiness.load(this.channel.args);
          let ids = new Set(channels.map((x) => x.data.DeviceId));
          this.table.extra = this.datas.filter((x) => ids.has(x.Id));
        }
        this.table.load.emit({ args: this.table.args, extra: this.table.extra });
      },
      select: (data?: IDevice) => {
        if (data) {
          this.channel.args.db31 = data instanceof DB31Device;
          this.channel.args.deviceId = data.Id;
          this.channel.load.emit(this.channel.args);
        } else {
          this.channel.clear.emit();
        }
      },
    },
  };

  channel = {
    args: {} as SystemDeviceChannelTableArgs,
    load: new EventEmitter<SystemDeviceChannelTableArgs>(),
    clear: new EventEmitter<void>(),
    on: {
      preview: (data: VideoChannel) => {
        this.preview.emit(data);
      },
    },
  };
}
