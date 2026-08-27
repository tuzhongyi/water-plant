import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { SystemDownloadContainerComponent } from '../system-download-container/system-download-container.component';
import { SystemDownloadHeaderComponent } from '../system-download-header/system-download-header.component';
import { SystemDownloadRegionComponent } from '../system-download-region/system-download-region.component';

@Component({
  selector: 'hw-system-download-manager',
  imports: [
    CommonModule,
    SystemDownloadHeaderComponent,
    SystemDownloadRegionComponent,
    SystemDownloadContainerComponent,
  ],
  templateUrl: './system-download-manager.component.html',
  styleUrl: './system-download-manager.component.less',
})
export class SystemDownloadManagerComponent {
  /** 左侧区域树加载完成后导入的区域树 */
  nodes = signal<RegionTreeNode[]>([]);

  selected?: RegionTreeNode;

  on = {
    loaded: (datas: RegionTreeNode[]) => {
      this.nodes.set(datas);
    },
  };
}
