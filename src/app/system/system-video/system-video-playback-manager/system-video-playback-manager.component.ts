import { CommonModule } from '@angular/common';
import { Component, EventEmitter } from '@angular/core';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { Duration } from '../../../common/tools/date-time-tool/duration.model';
import { PlaybackArgs } from '../../../share/video/video-player-content/video-player-content.model';
import { SystemVideoDeviceManagerComponent } from '../system-video-device/system-video-device-manager/system-video-device-manager.component';
import { SystemVideoPlaybackControlComponent } from '../system-video-playback-control/system-video-playback-control.component';
import { SystemVideoPlayerComponent } from '../system-video-player/system-video-player.component';

@Component({
  selector: 'hw-system-video-playback-manager',
  imports: [
    CommonModule,
    SystemVideoDeviceManagerComponent,
    SystemVideoPlayerComponent,
    SystemVideoPlaybackControlComponent,
  ],
  templateUrl: './system-video-playback-manager.component.html',
  styleUrl: './system-video-playback-manager.component.less',
})
export class SystemVideoPlaybackManagerComponent {
  device = {
    reload: new EventEmitter<void>(),
    selected: undefined as VideoChannel | RegionTreeNode | undefined,
  };

  control = {
    on: {
      playback: (duration: Duration) => {
        if (this.device.selected) {
          let args = new PlaybackArgs();
          args.cameraId = this.device.selected.Id;
          args.cameraName = this.device.selected.Name;
          args.stream = 1;
          args.duration = duration;
          this.player.playback.emit(args);
        }
      },
    },
  };

  player = {
    expand: false,
    playback: new EventEmitter<PlaybackArgs>(),
  };
}
