import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardStatistic1Component } from '../../../../common/components/card-statistic-1/card-statistic-1.component';
import { InputIconComponent } from '../../../../common/components/input-icon/input-icon.component';
import { VideoChannel } from '../../../../common/data-core/models/devices/video-channel.model';
import { RegionTreeNode } from '../../../../common/data-core/models/regions/region-tree-node.model';
import { TreeRegionArgs } from '../../../../share/tree/tree-region/tree-region.model';
import { PreviewArgs } from '../../../../share/video/video-player-content/video-player-content.model';
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
export class SystemVideoDeviceManagerComponent implements OnChanges, OnInit, OnDestroy {
  @Output() config = new EventEmitter<void>();
  @Input() reload?: EventEmitter<void>;
  @Output() preview = new EventEmitter<PreviewArgs>();
  @Input() selected?: RegionTreeNode | VideoChannel;
  @Output() selectedChange = new EventEmitter<RegionTreeNode | VideoChannel>();
  @Input() pagesize = 12;
  @Input() regionconfigable = false;

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
  ngOnChanges(changes: SimpleChanges): void {
    this.change.selected(changes['selected']);
  }

  private change = {
    selected: (change: SimpleChange) => {
      if (change) {
        if (this.selected instanceof VideoChannel) {
          this.device.selected = this.selected;
          this.region.selected = undefined;
        } else if (this.selected instanceof RegionTreeNode) {
          this.device.selected = undefined;
          this.region.selected = this.selected;
        } else {
          this.device.selected = undefined;
          this.region.selected = undefined;
        }
      }
    },
  };

  device = {
    show: false,
    selected: undefined as VideoChannel | undefined,
    load: new EventEmitter<SystemVideoDeviceListArgs>(),
    on: {
      preview: (data: VideoChannel) => {
        let args = new PreviewArgs();
        args.cameraId = data.Id;
        args.stream = 1;
        this.preview.emit(args);
      },
      select: (data: VideoChannel) => {
        this.selected = data;
        this.device.selected = data;
        this.selectedChange.emit(data);
      },
    },
  };
  region = {
    show: true,
    selected: undefined as RegionTreeNode | undefined,
    load: new EventEmitter<TreeRegionArgs>(),
    on: {
      config: () => {
        this.config.emit();
      },
      select: (data: RegionTreeNode) => {
        this.selected = data;
        this.region.selected = data;
        this.selectedChange.emit(data);
      },
      preview: (data: RegionTreeNode) => {
        let args = new PreviewArgs();
        args.stream = 1;
        args.cameraId = data.Id;
        args.cameraName = data.Name;

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
