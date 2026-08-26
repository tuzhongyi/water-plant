import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardComponent } from '../../../common/components/card/card.component';
import { InputIconComponent } from '../../../common/components/input-icon/input-icon.component';
import { RegionResource } from '../../../common/data-core/models/regions/region-resource.model';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { Region } from '../../../common/data-core/models/regions/region.model';
import { TreeRegionComponent } from '../../../share/tree/tree-region/tree-region.component';
import { TreeRegionArgs } from '../../../share/tree/tree-region/tree-region.model';

@Component({
  selector: 'hw-system-download-region',
  imports: [CommonModule, CardComponent, InputIconComponent, TreeRegionComponent],
  templateUrl: './system-download-region.component.html',
  styleUrl: './system-download-region.component.less',
})
export class SystemDownloadRegionComponent {
  @Input() selected?: RegionTreeNode | Region | RegionResource;
  @Output() selectedChange = new EventEmitter<RegionTreeNode | Region | RegionResource>();
  @Output() loaded = new EventEmitter<(RegionTreeNode | Region | RegionResource)[]>();

  tree = {
    args: {} as TreeRegionArgs,
    load: new EventEmitter<TreeRegionArgs>(),
  };

  on = {
    search: () => {
      this.tree.load.emit(this.tree.args);
    },
    loaded: (datas: (RegionTreeNode | Region | RegionResource)[]) => {
      this.loaded.emit(datas);
    },
    selected: (data: RegionTreeNode | Region | RegionResource) => {
      this.selected = data;
      this.selectedChange.emit(data);
    },
  };
}
