import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { FlatTreeNode, TreeComponent } from '../tree.component';
import { TreeRegionBusiness } from './tree-region.business';

@Component({
  selector: 'hw-tree-region',
  imports: [TreeComponent],
  templateUrl: './tree-region.component.html',
  styleUrls: ['./tree-region.component.less'],
  providers: [TreeRegionBusiness],
})
export class TreeRegionComponent implements AfterViewInit, OnDestroy {
  @Input() selected?: RegionTreeNode;
  @Output() selectedChange = new EventEmitter<RegionTreeNode>();

  @Input('load') reload?: EventEmitter<void>;
  @Output() loaded = new EventEmitter<RegionTreeNode[]>();

  /** 节点后的操作按钮是否可见，默认不可见 */
  @Input() actionable = false;

  @Output() download = new EventEmitter<RegionTreeNode>();
  @Output() video = new EventEmitter<RegionTreeNode>();

  nodes = signal<FlatTreeNode[]>([]);
  selectedId?: string;

  constructor(private business: TreeRegionBusiness) {}

  private subs = new Subscription();

  ngAfterViewInit(): void {
    this.loadTree();
    if (this.reload) {
      this.subs.add(this.reload.subscribe(() => this.loadTree()));
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private async loadTree(): Promise<void> {
    try {
      const nodes = await this.business.load();
      this.loaded.emit(nodes);
      if (!nodes || nodes.length === 0) return;
      this.buildTree(nodes);
    } catch {
      this.loaded.emit([]);
    }
  }

  /* ---- 树构建 ---- */

  private nodeIndex = 0;

  private buildTree(nodes: RegionTreeNode[]): void {
    this.nodes.set([]);
    this.nodeIndex = 0;
    for (const node of nodes) {
      this.addNode(node, undefined, 0);
    }
  }

  private addNode(node: RegionTreeNode, parentId: string | undefined, level: number): void {
    const id = `region_${node.Id}_${this.nodeIndex++}`;
    const children = this.sortChildren(node.Children ?? []);
    const expandable = children.length > 0;
    const icon = this.icon(node);
    let nodes = this.nodes();

    nodes.push({
      id,
      label: node.Name || node.Id,
      level,
      parentId,
      expandable,
      expanded: true,
      html: `<i class="hw-tree-icon ${icon}"></i><span class="hw-tree-label">${node.Name || node.Id}</span>`,
      actionsHtml:
        this.actionable && node.RegionNodeType === 2 ? this.resourceActions() : undefined,
      data: node,
    });
    this.nodes.set(nodes);

    for (const child of children) {
      this.addNode(child, id, level + 1);
    }
  }

  /**
   * 根据 RegionNodeType 判定 NodeType 的含义并映射图标：
   * Region（区域）→ NodeType 为 RegionType；Resource（资源）→ NodeType 为 DeviceResourceType
   */
  private icon(node: RegionTreeNode): string {
    if (node.RegionNodeType === 2) {
      return this.resourceIcon(node.NodeType);
    }
    return this.regionIcon(node.NodeType);
  }

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

  /** 资源节点操作按钮：下载、播放 */
  private resourceActions(): string {
    return `<div class="button hw-tree-action-btn hw-tree-action-download green" title="下载">
              <i class="mdi mdi-download"></i>
            </div>
            <div class="button hw-tree-action-btn hw-tree-action-play green" title="播放">
              <i class="howell-icon-video"></i>
            </div>`;
  }

  /** 子节点排序：Sort 编号 → 类型（资源在前）→ 有无子节点（无子节点在前）→ 名称 */
  private sortChildren(children: RegionTreeNode[]): RegionTreeNode[] {
    return [...children].sort((a, b) => {
      // const sort = (a.Sort ?? 0) - (b.Sort ?? 0);
      // if (sort !== 0) return sort;
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

  /** 无子节点（叶子）在前 */
  private leaf(node: RegionTreeNode): number {
    return node.Children && node.Children.length > 0 ? 1 : 0;
  }

  onNodeClick(node: FlatTreeNode): void {
    this.selected = node.data;
    this.selectedChange.emit(node.data);
  }

  onAction(e: { action: string; node: FlatTreeNode }): void {
    if (!e.node.data) return;
    if (e.action === 'download') this.download.emit(e.node.data);
    else if (e.action === 'play') this.video.emit(e.node.data);
  }
}
