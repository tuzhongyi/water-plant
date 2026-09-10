import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { SystemVideoDeviceManagerComponent } from '../../system-video/system-video-device/system-video-device-manager/system-video-device-manager.component';
import { SystemDownloadContainerComponent } from '../system-download-container/system-download-container.component';
import { SystemDownloadHeaderComponent } from '../system-download-header/system-download-header.component';

@Component({
  selector: 'hw-system-download-manager',
  imports: [
    CommonModule,
    SystemDownloadHeaderComponent,
    SystemVideoDeviceManagerComponent,
    SystemDownloadContainerComponent,
  ],
  templateUrl: './system-download-manager.component.html',
  styleUrl: './system-download-manager.component.less',
})
export class SystemDownloadManagerComponent {
  selected?: RegionTreeNode | VideoChannel;
}
