import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FlatTreeNode } from './tree.model';
export type { FlatTreeNode };

@Component({
  selector: 'hw-tree',
  standalone: true,
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.less'],
})
export class TreeComponent implements OnChanges {
  @Input() nodes: FlatTreeNode[] = [];
  @Input() selectedId?: string;
  /** 默认展开深度（level < displaydeep 的节点自动展开），默认 1 = 仅根展开 */
  @Input() displaydeep = 1;
  @Output() selectedIdChange = new EventEmitter<string>();
  @Output() nodeClick = new EventEmitter<FlatTreeNode>();
  @Output() toggle = new EventEmitter<FlatTreeNode>();
  @Output() action = new EventEmitter<{ action: string; node: FlatTreeNode }>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes'] || changes['displaydeep']) {
      this.applyExpandDeep();
    }
  }

  private applyExpandDeep(): void {
    for (const node of this.nodes) {
      if (!node.expandable) continue;
      node.expanded = node.level < this.displaydeep;
    }
  }

  /** 只返回可见节点（父级收起时隐藏子节点） */
  get visibleNodes(): FlatTreeNode[] {
    const collapsed = new Set<string>();
    for (const n of this.nodes) {
      if (n.expandable && !n.expanded) {
        collapsed.add(n.id);
      }
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

  onTreeClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    /* 向上查找带 action class 的元素（处理 <div><i/></div> 嵌套） */
    let actionEl: HTMLElement | null = target;
    while (actionEl && actionEl !== e.currentTarget) {
      const cls = actionEl.className || '';
      if (cls.includes('hw-tree-action-')) break;
      actionEl = actionEl.parentElement;
    }
    const cls = (actionEl?.className || target.className || '') as string;
    let actionName: string | null = null;
    if (cls.includes('hw-tree-action-bind')) actionName = 'bind';
    else if (cls.includes('hw-tree-action-unbind')) actionName = 'unbind';
    else if (cls.includes('hw-tree-action-position')) actionName = 'position';

    if (actionName) {
      e.stopPropagation();
      const nodeEl = target.closest('.hw-tree-node') as HTMLElement;
      const nodeId = nodeEl?.querySelector('[data-node-id]')?.getAttribute('data-node-id');
      const node = this.nodes.find((n) => n.id === nodeId);
      if (node) {
        this.action.emit({ action: actionName, node });
        this.onSelect(node);
      }
      return;
    }
    /* 点击 content 或 actions 区域 → 选中节点 */
    const nodeId = target.closest('[data-node-id]')?.getAttribute('data-node-id');
    if (nodeId) {
      const node = this.nodes.find((n) => n.id === nodeId);
      if (node) this.onSelect(node);
    }
  }

  onSelect(node: FlatTreeNode): void {
    this.selectedId = node.id;
    this.selectedIdChange.emit(node.id);
    this.nodeClick.emit(node);
  }

  onToggle(node: FlatTreeNode): void {
    if (node.expandable) {
      node.expanded = !node.expanded;
      this.toggle.emit(node);
    }
  }
}
