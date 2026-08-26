import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { InputIconComponent } from '../../../common/components/input-icon/input-icon.component';
import { TreeEditCreate, TreeEditDelete, TreeEditNode, TreeEditUpdate } from './tree-edit.model';

@Component({
  selector: 'hw-tree-edit',
  imports: [InputIconComponent],
  templateUrl: './tree-edit.component.html',
  styleUrls: ['./tree-edit.component.less'],
})
export class TreeEditComponent implements AfterViewInit, OnDestroy {
  @Input() nodes: TreeEditNode[] = [];
  @Input() selectedId?: string;
  @Output() selectedIdChange = new EventEmitter<string>();
  @Output() nodeClick = new EventEmitter<TreeEditNode>();
  /** 新增子节点的保存结果 */
  @Output() create = new EventEmitter<TreeEditCreate>();
  /** 修改节点的保存结果 */
  @Output() update = new EventEmitter<TreeEditUpdate>();
  /** 删除节点的结果 */
  @Output() delete = new EventEmitter<TreeEditDelete>();
  /** 展开 / 收起事件 */
  @Output() toggle = new EventEmitter<TreeEditNode>();
  /** 外部通知：新增根节点 */
  @Input() addRoot?: EventEmitter<void>;

  /** 正在编辑的节点 id */
  editingId?: string;
  /** 编辑输入框当前值 */
  editingValue = '';
  /** 正在添加子节点的父节点 id */
  addingParentId?: string;
  /** 是否正在添加根节点 */
  addingRoot = false;
  /** 添加输入框当前值 */
  addingValue = '';

  private subs = new Subscription();

  ngAfterViewInit(): void {
    if (this.addRoot) {
      this.subs.add(this.addRoot.subscribe(() => this.onAddRoot()));
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get visibleNodes(): TreeEditNode[] {
    const collapsed = new Set<string>();
    for (const n of this.nodes) {
      if (n.expandable && !n.expanded) collapsed.add(n.id);
    }
    if (collapsed.size === 0) return this.nodes;
    return this.nodes.filter((n) => {
      if (!n.parentId) return true;
      return !this.isAncestorCollapsed(n.parentId, collapsed);
    });
  }

  private isAncestorCollapsed(parentId: string, collapsed: Set<string>): boolean {
    if (collapsed.has(parentId)) return true;
    const parent = this.nodes.find((n) => n.id === parentId);
    if (parent?.parentId) return this.isAncestorCollapsed(parent.parentId, collapsed);
    return false;
  }

  onToggle(node: TreeEditNode): void {
    if (node.expandable) {
      node.expanded = !node.expanded;
      this.toggle.emit(node);
    }
  }

  onSelect(node: TreeEditNode): void {
    this.selectedId = node.id;
    this.selectedIdChange.emit(node.id);
    this.nodeClick.emit(node);
  }

  /* ---- 修改 ---- */

  onEdit(node: TreeEditNode): void {
    this.editingId = node.id;
    this.editingValue = node.label ?? '';
    this.addingParentId = undefined;
    this.addingRoot = false;
  }

  saveEdit(node: TreeEditNode): void {
    this.update.emit({ id: node.id, value: this.editingValue });
    this.editingId = undefined;
  }

  cancelEdit(): void {
    this.editingId = undefined;
  }

  /* ---- 添加 ---- */

  onAdd(node: TreeEditNode): void {
    node.expandable = true;
    node.expanded = true;
    this.addingParentId = node.id;
    this.addingValue = '';
    this.editingId = undefined;
    this.addingRoot = false;
  }

  saveAdd(parent: TreeEditNode): void {
    this.create.emit({ parentId: parent.id, value: this.addingValue });
    this.addingParentId = undefined;
  }

  cancelAdd(): void {
    this.addingParentId = undefined;
  }

  /* ---- 添加根节点 ---- */

  onAddRoot(): void {
    this.addingRoot = true;
    this.addingParentId = undefined;
    this.editingId = undefined;
    this.addingValue = '';
  }

  saveAddRoot(): void {
    this.create.emit({ value: this.addingValue });
    this.addingRoot = false;
    this.addingValue = '';
  }

  cancelAddRoot(): void {
    this.addingRoot = false;
  }

  /* ---- 删除 ---- */

  onDelete(node: TreeEditNode): void {
    this.delete.emit({ id: node.id });
  }
}
