import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RegionTreeNode } from '../../../../common/data-core/models/regions/region-tree-node.model';
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
  @Output() nodedblclick = new EventEmitter<RegionTreeNode>();
  @Input() selected?: RegionTreeNode;
  @Output() selectedChange = new EventEmitter<RegionTreeNode>();

  collapse = new EventEmitter();

  on = {
    collapse: () => {
      this.collapse.emit();
    },
    config: () => {
      this.config.emit();
    },
    dblclick: (data: RegionTreeNode) => {
      this.nodedblclick.emit(data);
    },
    select: (data: RegionTreeNode) => {
      this.selected = data;
      this.selectedChange.emit(this.selected);
    },
  };
}
