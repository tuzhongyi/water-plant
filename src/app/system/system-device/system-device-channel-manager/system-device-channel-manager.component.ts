import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EnumNameValue } from '../../../common/data-core/models/capabilities/enum-name-value.model';
import { IDevice } from '../../../common/data-core/models/common/device.interface';
import { DB31Device } from '../../../common/data-core/models/db31/db31-device.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { CapabilityTool } from '../../../common/tools/capability-tool/capability.tool';
import { PreviewArgs } from '../../../share/video/video-player-content/video-player-content.model';
import { SystemDeviceChannelTableComponent } from '../system-device-channel-table/system-device-channel-table.component';
import { SystemDeviceChannelTableArgs } from '../system-device-channel-table/system-device-channel-table.model';

@Component({
  selector: 'hw-system-device-channel-manager',
  imports: [CommonModule, FormsModule, SystemDeviceChannelTableComponent],
  templateUrl: './system-device-channel-manager.component.html',
  styleUrl: './system-device-channel-manager.component.less',
})
export class SystemDeviceChannelManagerComponent implements OnInit, OnChanges {
  @Input() device?: IDevice;
  @Output() preview = new EventEmitter<PreviewArgs>();

  constructor(private capability: CapabilityTool) {}

  ngOnInit(): void {
    this.capability.device.VideoFormats.then((x) => (this.source.videoFormats = x));
    this.capability.device.AudioFormats.then((x) => (this.source.audioFormats = x));
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.change.device(changes['device']);
  }

  private change = {
    device: (change: SimpleChange) => {
      if (change) {
        this.table.args.db31 = this.device instanceof DB31Device;
        this.table.args.deviceId = this.device?.Id;
      }
    },
  };

  source = {
    videoFormats: [] as EnumNameValue[],
    audioFormats: [] as EnumNameValue[],
  };

  table = {
    args: {} as SystemDeviceChannelTableArgs,
    load: new EventEmitter<SystemDeviceChannelTableArgs>(),
    on: {
      search: () => {
        this.table.load.emit(this.table.args);
      },
      preview: (data: VideoChannel) => {
        let args = new PreviewArgs();
        args.cameraId = data.Id;
        args.cameraName = data.Name;
        args.stream = 1;
        this.preview.emit(args);
      },
    },
  };
}
