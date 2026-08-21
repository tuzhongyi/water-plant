import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';

@Component({
  selector: 'hw-region-explorer',
  imports: [CommonModule],
  templateUrl: './region-explorer.component.html',
  styleUrl: './region-explorer.component.less',
})
export class RegionExplorerComponent implements OnChanges {
  /** 外部导入的区域树 */
  @Input() nodes: RegionTreeNode[] = [];
  /** 当前选中的结点 */
  @Input() selected?: RegionTreeNode;
  @Output() selectedChange = new EventEmitter<RegionTreeNode>();

  /** 表头列宽 */
  widths = ['60px', 'auto', '160px', '30%'];

  /** 当前目录路径（从根到当前目录的结点） */
  path: RegionTreeNode[] = [];
  /** 当前目录下的子结点 */
  datas: RegionTreeNode[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes']) {
      this.reset();
    }
  }

  /** 是否在根目录 */
  get root(): boolean {
    return this.path.length === 0;
  }

  on = {
    /** 向上 */
    up: () => {
      if (this.root) return;
      this.path.pop();
      this.refresh();
    },
    /** 回到根目录 */
    root: () => {
      this.path = [];
      this.refresh();
    },
    /** 点击地址栏中的某一级 */
    path: (index: number) => {
      this.path = this.path.slice(0, index + 1);
      this.refresh();
    },
    /** 单击选中 */
    select: (item: RegionTreeNode) => {
      if (this.selected === item) return;
      this.selected = item;
      this.selectedChange.emit(item);
    },
    /** 双击进入子目录 */
    dblclick: (item: RegionTreeNode) => {
      if (!this.expandable(item)) return;
      this.path.push(item);
      this.refresh();
    },
  };

  /* ---- 视图 ---- */

  private reset(): void {
    this.path = [];
    this.refresh();
  }

  private refresh(): void {
    const current = this.path[this.path.length - 1];
    this.datas = this.sortChildren(current ? (current.Children ?? []) : this.nodes);
  }

  /** 是否有子结点（可进入） */
  expandable(node: RegionTreeNode): boolean {
    return !!node.Children && node.Children.length > 0;
  }

  /** 类型文本 */
  typeText(node: RegionTreeNode): string {
    if (node.RegionNodeType === 2) {
      return this.resourceType(node.NodeType);
    }
    return this.regionType(node.NodeType);
  }

  /** 图标（与 tree-region 保持一致） */
  icon(node: RegionTreeNode): string {
    if (node.RegionNodeType === 2) {
      return this.resourceIcon(node.NodeType);
    }
    return this.regionIcon(node.NodeType);
  }

  /* ---- 图标映射（与 tree-region 保持一致） ---- */

  /** RegionType：0-普通区域，1-楼栋，2-房屋单元 */
  private regionIcon(nodeType: number): string {
    switch (nodeType) {
      case 1:
        return 'howell-icon-view';
      case 2:
        return 'mdi mdi-vector-union';
      default:
        return 'mdi mdi-grid';
    }
  }

  /** DeviceResourceType：1-摄像机，2-报警器，3-门禁控制器，4-传感器 */
  private resourceIcon(nodeType: number): string {
    switch (nodeType) {
      case 2:
        return 'howell-icon-alarm_line';
      case 3:
        return 'howell-icon-access_door';
      case 4:
        return 'howell-icon-sensor_line';
      case 1:
        return 'howell-icon-camera_line';
      default:
        return 'howell-icon-device_line';
    }
  }

  private regionType(nodeType: number): string {
    switch (nodeType) {
      case 1:
        return '楼栋';
      case 2:
        return '房屋单元';
      default:
        return '区域';
    }
  }

  private resourceType(nodeType: number): string {
    switch (nodeType) {
      case 1:
        return '摄像机';
      case 2:
        return '报警器';
      case 3:
        return '门禁控制器';
      case 4:
        return '传感器';
      default:
        return '设备';
    }
  }

  /* ---- 排序（与 tree-region 保持一致） ---- */

  private sortChildren(children: RegionTreeNode[]): RegionTreeNode[] {
    return [...children].sort((a, b) => {
      const type = this.order(a) - this.order(b);
      if (type !== 0) return type;
      const leaf = this.leaf(a) - this.leaf(b);
      if (leaf !== 0) return leaf;
      return (a.Name || a.Id).localeCompare(b.Name || b.Id);
    });
  }

  /** RegionNodeType：1-区域，2-资源（资源在前） */
  private order(node: RegionTreeNode): number {
    return node.RegionNodeType === 2 ? 0 : 1;
  }

  /** 无子结点（叶子）在前 */
  private leaf(node: RegionTreeNode): number {
    return node.Children && node.Children.length > 0 ? 1 : 0;
  }
}
