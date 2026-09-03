import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { FlatTreeNode, TreeComponent } from '../component/tree.component';
import { TreeRegionBusiness } from './tree-region.business';
import { TreeRegionArgs } from './tree-region.model';

@Component({
  selector: 'hw-tree-region',
  imports: [TreeComponent],
  templateUrl: './tree-region.component.html',
  styleUrls: ['./tree-region.component.less'],
  providers: [TreeRegionBusiness],
})
export class TreeRegionComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() load?: EventEmitter<TreeRegionArgs>;
  @Input() collapse?: EventEmitter<void>;
  @Input() selected?: RegionTreeNode;
  @Output() selectedChange = new EventEmitter<RegionTreeNode>();

  @Input() reload?: EventEmitter<void>;
  @Output() loaded = new EventEmitter<RegionTreeNode[]>();

  @Output() nodedblclick = new EventEmitter<RegionTreeNode>();

  /** 节点后的操作按钮是否可见，默认不可见 */
  @Input() actionable = false;

  nodes = signal<FlatTreeNode[]>([]);
  selectedId?: string;

  args: TreeRegionArgs = {};
  /** 用户手动展开/闭合的节点（id → 展开状态），load 后据此恢复 */
  private overrides = new Map<string, boolean>();

  constructor(private business: TreeRegionBusiness) {}

  private subs = new Subscription();
  ngOnChanges(changes: SimpleChanges): void {
    this.change.selected(changes['selected']);
  }

  ngAfterViewInit(): void {
    this.regist();
    this.loadTree();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private change = {
    selected: (change: SimpleChange) => {
      if (change) {
        this.syncSelectedId();
      }
    },
  };

  /** 订阅外部 load 事件：父级触发筛选时以新 args 重新加载 */
  private regist(): void {
    if (this.load) {
      this.subs.add(
        this.load.subscribe((args) => {
          this.args = { ...args };
          this.loadTree();
        }),
      );
    }
    if (this.reload) {
      this.subs.add(this.reload.subscribe(() => this.loadTree()));
    }
    if (this.collapse) {
      this.subs.add(this.collapse.subscribe(() => this.collapseAll()));
    }
  }

  private async loadTree(): Promise<void> {
    try {
      const nodes = await this.business.load(this.args);
      this.applyExpanded(nodes);
      this.nodes.set(nodes);
      this.syncSelectedId();
      this.loaded.emit(this.roots(nodes));
    } catch {
      this.nodes.set([]);
      this.loaded.emit([]);
    }
  }

  /** 恢复展开状态：用户手动设置优先，否则按默认深度 */
  private applyExpanded(nodes: FlatTreeNode[]): void {
    for (const node of nodes) {
      node.expanded = this.overrides.has(node.id)
        ? this.overrides.get(node.id)!
        : this.expandDefault(node);
    }
  }

  /** 默认展开：筛选时按 filter 标记的展开状态，否则仅根节点 */
  private expandDefault(node: FlatTreeNode): boolean {
    if (this.args.name) {
      return (node.data as RegionTreeNode)?.expanded ?? true;
    }
    return node.level < 1;
  }

  /** 由扁平结点还原根区域树（loaded 对外输出） */
  private roots(nodes: FlatTreeNode[]): RegionTreeNode[] {
    return nodes.filter((n) => !n.parentId).map((n) => n.data as RegionTreeNode);
  }

  /** 根据当前 selected（RegionTreeNode）解析出对应扁平结点的 id，用于高亮 */
  private syncSelectedId(): void {
    const selected = this.selected;
    if (!selected) {
      this.selectedId = undefined;
      return;
    }
    const node = this.nodes().find(
      (n) => n.data === selected || n.data?.Id === selected.Id,
    );
    this.selectedId = node?.id;
  }

  onToggle(node: FlatTreeNode): void {
    this.overrides.set(node.id, !!node.expanded);
  }

  /** 收缩所有节点 */
  collapseAll(): void {
    const nodes = this.nodes();
    for (const node of nodes) {
      if (node.expandable) {
        node.expanded = false;
        this.overrides.set(node.id, false);
      }
    }
    this.nodes.set([...nodes]);
  }

  onNodeClick(node: FlatTreeNode): void {
    this.selected = node.data;
    this.selectedId = node.id;
    this.selectedChange.emit(node.data);
  }

  onNodeDblclick(node: FlatTreeNode): void {
    if (node.data instanceof RegionTreeNode && node.data.RegionNodeType == 1) {
      node.expanded = !node.expanded;
    } else {
      this.nodedblclick.emit(node.data);
    }
  }

  onAction(e: { action: string; node: FlatTreeNode }): void {
    if (!e.node.data) return;
  }
}
