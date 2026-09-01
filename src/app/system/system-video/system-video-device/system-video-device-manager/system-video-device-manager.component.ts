import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardStatistic1Component } from '../../../../common/components/card-statistic-1/card-statistic-1.component';
import { InputIconComponent } from '../../../../common/components/input-icon/input-icon.component';
import { VideoChannel } from '../../../../common/data-core/models/devices/video-channel.model';
import { RegionResource } from '../../../../common/data-core/models/regions/region-resource.model';
import { RegionTreeNode } from '../../../../common/data-core/models/regions/region-tree-node.model';
import { TreeRegionArgs } from '../../../../share/tree/tree-region/tree-region.model';
import {
  PlaybackArgs,
  PreviewArgs,
} from '../../../../share/video/video-player-content/video-player-content.model';
import { SystemVideoDeviceListComponent } from '../system-video-device-list/system-video-device-list.component';
import { SystemVideoDeviceListArgs } from '../system-video-device-list/system-video-device-list.model';
import { SystemVideoDeviceRegionComponent } from '../system-video-device-region/system-video-device-region.component';

@Component({
  selector: 'hw-system-video-device-manager',
  imports: [
    CommonModule,
    FormsModule,
    InputIconComponent,
    CardStatistic1Component,
    SystemVideoDeviceRegionComponent,
    SystemVideoDeviceListComponent,
  ],
  templateUrl: './system-video-device-manager.component.html',
  styleUrl: './system-video-device-manager.component.less',
})
export class SystemVideoDeviceManagerComponent implements OnInit, OnDestroy {
  @Output() config = new EventEmitter<void>();
  @Input() reload?: EventEmitter<void>;
  @Output() preview = new EventEmitter<PreviewArgs>();
  @Output() playback = new EventEmitter<PlaybackArgs>();
  @Input() pagesize = 12;

  constructor() {}

  private handle?: any;

  ngOnInit(): void {
    this.handle = this.manager.on.keydown.bind(this);
    document.addEventListener('keydown', this.handle);
  }
  ngOnDestroy(): void {
    if (this.handle) {
      document.removeEventListener('keydown', this.handle);
    }
  }

  device = {
    show: false,
    load: new EventEmitter<SystemVideoDeviceListArgs>(),
    on: {
      preview: (data: VideoChannel) => {
        let args = new PreviewArgs();
        args.cameraId = data.Id;
        args.stream = 1;
        this.preview.emit(args);
      },
    },
  };
  region = {
    show: true,
    load: new EventEmitter<TreeRegionArgs>(),
    on: {
      config: () => {
        this.config.emit();
      },
      preview: (data: RegionResource | RegionTreeNode) => {
        let args = new PreviewArgs();
        args.stream = 1;

        if (data instanceof RegionTreeNode) {
          args.cameraId = data.Id;
          args.cameraName = data.Name;
        } else {
          args.cameraId = data.ResourceId;
          args.cameraName = data.ResourceName;
        }

        this.preview.emit(args);
      },
    },
  };

  manager = {
    args: {} as SystemVideoDeviceListArgs,
    on: {
      mode: () => {
        this.device.show = !this.device.show;
        this.region.show = !this.device.show;
      },
      keydown: (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          this.manager.on.search();
        }
      },

      search: () => {
        this.manager.args.first = true;
        if (this.device.show) {
          this.device.load.emit(this.manager.args);
        }
        if (this.region.show) {
          this.region.load.emit(this.manager.args);
        }
      },
    },
  };
}
