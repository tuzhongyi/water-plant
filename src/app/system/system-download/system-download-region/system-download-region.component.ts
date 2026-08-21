import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardComponent } from '../../../common/components/card/card.component';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { TreeRegionComponent } from '../../../share/tree/tree-region/tree-region.component';

@Component({
  selector: 'hw-system-download-region',
  imports: [CommonModule, CardComponent, TreeRegionComponent],
  templateUrl: './system-download-region.component.html',
  styleUrl: './system-download-region.component.less',
})
export class SystemDownloadRegionComponent {
  @Input() selected?: RegionTreeNode;
  @Output() selectedChange = new EventEmitter<RegionTreeNode>();
  @Output() loaded = new EventEmitter<RegionTreeNode[]>();
  @Output() download = new EventEmitter<RegionTreeNode>();

  on = {
    loaded: (datas: RegionTreeNode[]) => {
      this.loaded.emit(datas);
    },
    selected: (data: RegionTreeNode) => {
      this.selected = data;
      this.selectedChange.emit(data);
    },
    download: (data: RegionTreeNode) => {
      this.download.emit(data);
    },
  };
}
