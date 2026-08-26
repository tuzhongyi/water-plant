import { CommonModule } from '@angular/common';
import { Component, EventEmitter } from '@angular/core';
import { CardComponent } from '../../../common/components/card/card.component';
import { WindowComponent } from '../../../common/components/window-control/window.component';
import { PreviewArgs } from '../../../share/video/video-player-content/video-player-content.model';
import { SystemVideoDeviceManagerComponent } from '../system-video-device/system-video-device-manager/system-video-device-manager.component';
import { SystemVideoDeviceRegionConfigComponent } from '../system-video-device/system-video-device-region-config/system-video-device-region-config.component';
import { SystemVideoPlayerComponent } from '../system-video-player/system-video-player.component';
import { SystemVideoManagerWindow } from './system-video-manager.window';

@Component({
  selector: 'hw-system-video-manager',
  imports: [
    CommonModule,
    CardComponent,
    SystemVideoDeviceManagerComponent,
    SystemVideoPlayerComponent,

    WindowComponent,
    SystemVideoDeviceRegionConfigComponent,
  ],
  templateUrl: './system-video-manager.component.html',
  styleUrl: './system-video-manager.component.less',
})
export class SystemVideoManagerComponent {
  constructor() {}
  window = new SystemVideoManagerWindow(this);

  device = {
    reload: new EventEmitter<void>(),
    on: {
      preview: (args: PreviewArgs) => {
        this.player.preview.emit(args);
      },
    },
  };
  player = {
    preview: new EventEmitter<PreviewArgs>(),
  };
}
