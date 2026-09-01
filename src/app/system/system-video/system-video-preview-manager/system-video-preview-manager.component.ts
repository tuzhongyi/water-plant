import { CommonModule } from '@angular/common';
import { Component, EventEmitter } from '@angular/core';
import { WindowComponent } from '../../../common/components/window-control/window.component';
import { VideoChannelViewGroup } from '../../../common/data-core/models/devices/video-channel-view-group.model';
import { PreviewArgs } from '../../../share/video/video-player-content/video-player-content.model';
import { SystemVideoDeviceManagerComponent } from '../system-video-device/system-video-device-manager/system-video-device-manager.component';
import { SystemVideoDeviceRegionConfigComponent } from '../system-video-device/system-video-device-region-config/system-video-device-region-config.component';
import { SystemVideoPlayerComponent } from '../system-video-player/system-video-player.component';
import { SystemVideoViewGroupManagerComponent } from '../system-video-view-group/system-video-view-group-manager/system-video-view-group-manager.component';
import { SystemVideoPreviewManagerWindow } from './system-video-preview-manager.window';

@Component({
  selector: 'hw-system-video-preview-manager',
  imports: [
    CommonModule,
    SystemVideoDeviceManagerComponent,
    SystemVideoPlayerComponent,

    WindowComponent,
    SystemVideoDeviceRegionConfigComponent,
    SystemVideoViewGroupManagerComponent,
  ],
  templateUrl: './system-video-preview-manager.component.html',
  styleUrl: './system-video-preview-manager.component.less',
})
export class SystemVideoPreviewManagerComponent {
  constructor() {}
  window = new SystemVideoPreviewManagerWindow(this);

  device = {
    reload: new EventEmitter<void>(),
    on: {
      preview: (args: PreviewArgs) => {
        this.player.preview.emit(args);
      },
    },
  };
  player = {
    expand: false,
    preview: new EventEmitter<PreviewArgs>(),

    view: {
      get: new EventEmitter<(e: VideoChannelViewGroup) => void>(),
      on: {
        get: () => {
          this.player.view.get.emit((e) => {
            console.log(e);
          });
        },
      },
    },
  };
}
