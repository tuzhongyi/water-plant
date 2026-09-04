import { CommonModule } from '@angular/common';
import { Component, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { WindowConfirmComponent } from '../../../common/components/window-confirm/window-confirm.component';
import { WindowComponent } from '../../../common/components/window-control/window.component';
import { VideoChannelViewGroup } from '../../../common/data-core/models/devices/video-channel-view-group.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { PreviewArgs } from '../../../share/video/video-player-content/video-player-content.model';
import { ScreenMode } from '../../../share/video/video-player-list/video-player-list.model';
import { SystemVideoDeviceManagerComponent } from '../system-video-device/system-video-device-manager/system-video-device-manager.component';
import { SystemVideoDeviceRegionConfigComponent } from '../system-video-device/system-video-device-region-config/system-video-device-region-config.component';
import { SystemVideoPlayerComponent } from '../system-video-player/system-video-player.component';
import { SystemVideoViewGroupBusiness } from '../system-video-view-group/business/system-video-view-group.business';
import { SystemVideoViewGroupManagerComponent } from '../system-video-view-group/system-video-view-group-manager/system-video-view-group-manager.component';
import { SystemVideoPreviewManagerWindow } from './window/system-video-preview-manager.window';

@Component({
  selector: 'hw-system-video-preview-manager',
  imports: [
    CommonModule,
    FormsModule,
    SystemVideoDeviceManagerComponent,
    SystemVideoPlayerComponent,

    WindowComponent,
    WindowConfirmComponent,
    SystemVideoDeviceRegionConfigComponent,
    SystemVideoViewGroupManagerComponent,
  ],
  templateUrl: './system-video-preview-manager.component.html',
  styleUrl: './system-video-preview-manager.component.less',
  providers: [SystemVideoViewGroupBusiness],
})
export class SystemVideoPreviewManagerComponent {
  constructor(
    public business: SystemVideoViewGroupBusiness,
    public toastr: ToastrService,
  ) {}
  window = new SystemVideoPreviewManagerWindow(this);

  device = {
    minimize: false,
    reload: new EventEmitter<void>(),
    selected: undefined as RegionTreeNode | VideoChannel | undefined,
    on: {
      minimize: (value: boolean) => {
        this.device.minimize = value;
        if (value) {
          this.viewgroup.minimize = false;
        }
      },
      preview: (args: PreviewArgs) => {
        this.player.preview.emit(args);
      },
      select: (data?: RegionTreeNode | VideoChannel) => {
        if (data) {
          this.device.selected = data;
          this.viewgroup.selected = undefined;
        }
      },
    },
  };
  player = {
    expand: false,
    screen: ScreenMode.four,
    preview: new EventEmitter<PreviewArgs>(),
    viewgroup: new EventEmitter<PreviewArgs[]>(),
  };
  viewgroup = {
    minimize: false,
    load: new EventEmitter<void>(),
    save: new EventEmitter<VideoChannelViewGroup>(),
    selected: undefined as VideoChannelViewGroup | undefined,
    on: {
      minimize: (value: boolean) => {
        this.viewgroup.minimize = value;
        if (value) {
          this.device.minimize = false;
        }
      },
      select: (data?: VideoChannelViewGroup) => {
        if (data) {
          this.viewgroup.selected = data;
          this.device.selected = undefined;
        }
      },
      save: (e: VideoChannelViewGroup) => {
        this.viewgroup.save.emit(e);
      },
      play: (e: VideoChannelViewGroup) => {
        this.player.screen = e.ViewNumber;
        let args = e.Views.map((x) => {
          let args = new PreviewArgs();
          args.cameraId = x.VideoChannelId;
          args.cameraName = x.VideoChannelName;
          args.stream = x.StreamType;
          args.index = x.ViewNo - 1;
          return args;
        });
        this.player.viewgroup.emit(args);
      },
      update: (e: VideoChannelViewGroup) => {
        this.window.viewgroup.update.on.open(e);
      },
      delete: (e: VideoChannelViewGroup) => {
        this.window.viewgroup.delete.on.open(e);
      },
    },
  };
}
