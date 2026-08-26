import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RegionResource } from '../../../../common/data-core/models/regions/region-resource.model';
import { RegionTreeNode } from '../../../../common/data-core/models/regions/region-tree-node.model';
import { Region } from '../../../../common/data-core/models/regions/region.model';
import { TreeRegionComponent } from '../../../../share/tree/tree-region/tree-region.component';
import { TreeRegionArgs } from '../../../../share/tree/tree-region/tree-region.model';

@Component({
  selector: 'hw-system-video-device-region',
  imports: [CommonModule, TreeRegionComponent],
  templateUrl: './system-video-device-region.component.html',
  styleUrl: './system-video-device-region.component.less',
})
export class SystemVideoDeviceRegionComponent {
  @Input() load?: EventEmitter<TreeRegionArgs>;
  @Input() configable = true;
  @Input() actionable = false;
  @Output() config = new EventEmitter<void>();
  @Input() reload?: EventEmitter<void>;
  @Output() nodedblclick = new EventEmitter<RegionResource | RegionTreeNode>();

  collapse = new EventEmitter();

  on = {
    collapse: () => {
      this.collapse.emit();
    },
    config: () => {
      this.config.emit();
    },
    dblclick: (data: Region | RegionResource | RegionTreeNode) => {
      if (data instanceof Region) return;
      this.nodedblclick.emit(data);
    },
  };
}
