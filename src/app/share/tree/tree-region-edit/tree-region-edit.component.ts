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
import { FlatTreeNode } from '../component/tree.model';
import { TreeEditComponent } from '../tree-edit/tree-edit.component';
import {
  TreeEditCreate,
  TreeEditDelete,
  TreeEditNode,
  TreeEditUpdate,
} from '../tree-edit/tree-edit.model';
import { TreeRegionBusiness } from '../tree-region/tree-region.business';
import { TreeRegionArgs } from '../tree-region/tree-region.model';
import { TreeRegionEditOutputArgs } from './tree-region-edit.model';

@Component({
  selector: 'hw-tree-region-edit',
  imports: [TreeEditComponent],
  templateUrl: './tree-region-edit.component.html',
  styleUrls: ['./tree-region-edit.component.less'],
  providers: [TreeRegionBusiness],
})
export class TreeRegionEditComponent implements AfterViewInit, OnDestroy {
  @Input() load?: EventEmitter<TreeRegionArgs>;
  @Input() reload?: EventEmitter<void>;
  @Input() collapse?: EventEmitter<void>;
  /** 外部通知：新增根节点（透传给树编辑组件） */
  @Input() addRoot?: EventEmitter<void>;
  @Output() loaded = new EventEmitter<RegionTreeNode[]>();
  /** 新增子节点的操作结果 */
  @Output() create = new EventEmitter<TreeRegionEditOutputArgs>();
  /** 修改节点的操作结果 */
  @Output() update = new EventEmitter<TreeRegionEditOutputArgs>();
  /** 删除节点的操作结果 */
  @Output() delete = new EventEmitter<TreeRegionEditOutputArgs>();
  private _selected?: RegionTreeNode;
  /** 当前选中结点（双向绑定） */
  @Input()
  get selected(): RegionTreeNode | undefined {
    return this._selected;
  }
  set selected(value: RegionTreeNode | undefined) {
    this._selected = value;
    this.selectedId = this.findSelectedId();
  }
  @Output() selectedChange = new EventEmitter<RegionTreeNode>();

  nodes = signal<TreeEditNode[]>([]);
  selectedId?: string;
  args: TreeRegionArgs = {};
  /** 用户手动展开/闭合的节点（id → 展开状态），load 后据此恢复 */
  private overrides = new Map<string, boolean>();

  constructor(private business: TreeRegionBusiness) {}

  private subs = new Subscription();

  ngAfterViewInit(): void {
    this.regist();
    this.loadTree();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** 订阅外部 load / reload / collapse 事件 */
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
      const flat = await this.business.load(this.args);
      const nodes = flat.map((n) => this.toEdit(n));
      this.applyExpanded(nodes);
      this.nodes.set(nodes);
      this.selectedId = this.findSelectedId();
      this.loaded.emit(this.roots(flat));
    } catch {
      this.nodes.set([]);
      this.loaded.emit([]);
    }
  }

  /** FlatTreeNode → TreeEditNode：按结点类型设置可编辑 / 可添加 */
  private toEdit(node: FlatTreeNode): TreeEditNode {
    const resource = this.isResource(node.data);
    return {
      ...node,
      editable: !resource,
      addable: !resource,
      deletable: !resource,
    };
  }

  /** 判断结点是否为资源（资源为叶子，不可再添加子节点） */
  private isResource(data: RegionTreeNode): boolean {
    return data.RegionNodeType === 2;
  }

  /** 由扁平结点还原根区域树（loaded 对外输出） */
  private roots(nodes: FlatTreeNode[]): RegionTreeNode[] {
    return nodes.filter((n) => !n.parentId).map((n) => n.data as RegionTreeNode);
  }

  /** 恢复展开状态：用户手动设置优先，否则按默认深度 */
  private applyExpanded(nodes: TreeEditNode[]): void {
    for (const node of nodes) {
      node.expanded = this.overrides.has(node.id)
        ? this.overrides.get(node.id)!
        : this.expandDefault(node);
    }
  }

  /** 默认展开：筛选时按 filter 标记的展开状态，否则仅根节点 */
  private expandDefault(node: TreeEditNode): boolean {
    if (this.args.name) {
      return (node.data as RegionTreeNode)?.expanded ?? true;
    }
    return node.level < 1;
  }

  /** 当前选中结点 → 扁平结点 id（用于高亮） */
  private findSelectedId(): string | undefined {
    const selected = this.selected;
    if (!selected) return undefined;
    const node = this.nodes().find((n) => {
      if (n.data === selected) return true;
      return n.data instanceof RegionTreeNode && n.data.Id === selected.Id;
    });
    return node?.id;
  }

  onToggle(node: TreeEditNode): void {
    this.overrides.set(node.id, !!node.expanded);
  }

  /** 点击结点：更新选中并对外输出 */
  onNodeClick(node: TreeEditNode<RegionTreeNode>): void {
    this.selected = node.data;
    this.selectedChange.emit(node.data);
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

  /** 新增节点：补上父结点原始数据后对外输出（无 parentId 为新增根节点） */
  onCreate(e: TreeEditCreate): void {
    if (!e.parentId) {
      this.create.emit({ value: e.value });
      return;
    }
    const node = this.nodes().find((n) => n.id === e.parentId);
    if (!node) return;
    this.create.emit({ value: e.value, data: node.data });
  }

  /** 修改节点：补上结点原始数据后对外输出 */
  onUpdate(e: TreeEditUpdate): void {
    const node = this.nodes().find((n) => n.id === e.id);
    if (!node) return;
    this.update.emit({ value: e.value, data: node.data });
  }

  /** 删除节点：补上结点原始数据后对外输出 */
  onDelete(e: TreeEditDelete): void {
    const node = this.nodes().find((n) => n.id === e.id);
    if (!node) return;
    this.delete.emit({ data: node.data });
  }
}
