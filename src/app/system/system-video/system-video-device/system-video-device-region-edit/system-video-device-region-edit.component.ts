import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RegionTreeNode } from '../../../../common/data-core/models/regions/region-tree-node.model';
import { TreeRegionEditComponent } from '../../../../share/tree/tree-region-edit/tree-region-edit.component';
import { TreeRegionEditArgs } from '../../../../share/tree/tree-region-edit/tree-region-edit.model';

@Component({
  selector: 'hw-system-video-device-region-edit',
  imports: [CommonModule, TreeRegionEditComponent],
  templateUrl: './system-video-device-region-edit.component.html',
  styleUrl: './system-video-device-region-edit.component.less',
})
export class SystemVideoDeviceRegionEditComponent {
  /** 当前选中结点（双向绑定） */
  @Input() selected?: RegionTreeNode;
  @Output() selectedChange = new EventEmitter<RegionTreeNode>();

  /** 触发区域树重新加载 */
  @Input() reload?: EventEmitter<void>;

  @Output() loaded = new EventEmitter<RegionTreeNode[]>();
  @Output() create = new EventEmitter<TreeRegionEditArgs>();
  @Output() update = new EventEmitter<TreeRegionEditArgs>();
  @Output() delete = new EventEmitter<TreeRegionEditArgs>();

  /** 通知树组件新增根节点 */
  addRoot = new EventEmitter<void>();
  collapse = new EventEmitter<void>();
  on = {
    select: (data: RegionTreeNode) => {
      this.selected = data;
      this.selectedChange.emit(data);
    },
    collapse: () => {
      this.collapse.emit();
    },
    addRoot: () => {
      this.collapse.emit();
      this.addRoot.emit();
    },
  };
}
