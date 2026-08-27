import { Injectable } from '@angular/core';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { RegionRequestService } from '../../../common/data-core/request/services/region/region.service';
import { FlatTreeNode } from '../component/tree.model';
import { TreeRegionConverter } from './tree-region.converter';
import { TreeRegionArgs } from './tree-region.model';

@Injectable()
export class TreeRegionBusiness {
  constructor(private service: RegionRequestService) {}

  private converter = new TreeRegionConverter();

  async load(args: TreeRegionArgs): Promise<FlatTreeNode[]> {
    let nodes = await this.tree();
    if (args.name) {
      nodes = this.filter(nodes, args);
    }
    return this.converter.flat(nodes);
  }

  /** 在完整区域树中按名称筛选：保留匹配结点（区域/资源）及其祖先链 */
  private filter(tree: RegionTreeNode[], args: TreeRegionArgs): RegionTreeNode[] {
    const query = (args.name ?? '').trim().toLowerCase();

    const matches = (node: RegionTreeNode): boolean =>
      `${node.Name ?? ''} ${node.Description ?? ''}`.toLowerCase().includes(query);

    /** 子树内是否存在命中结点（不含自身） */
    const hasHitBelow = (node: RegionTreeNode): boolean =>
      (node.Children ?? []).some((child) => matches(child) || hasHitBelow(child));

    /** 命中区域保留全部子节点，此处仅为各层区域结点标记展开状态 */
    const mark = (nodes: RegionTreeNode[]): void => {
      for (const child of nodes) {
        if (child.RegionNodeType === 1) {
          child.expanded = hasHitBelow(child);
        }
        if (child.Children) mark(child.Children);
      }
    };

    const visit = (nodes: RegionTreeNode[]): RegionTreeNode[] => {
      const result: RegionTreeNode[] = [];
      for (const node of nodes) {
        if (matches(node)) {
          if (node.RegionNodeType === 1) {
            // 命中区域：不删子节点；下方还有命中则展开，否则折叠
            mark(node.Children ?? []);
            node.expanded = hasHitBelow(node);
          }
          result.push(node);
        } else {
          const children = node.Children ? visit(node.Children) : [];
          if (children.length > 0) {
            node.Children = children;
            node.expanded = true;
            result.push(node);
          }
        }
      }
      return result;
    };

    return visit(tree);
  }

  private tree(): Promise<RegionTreeNode[]> {
    return this.service.tree.nodes();
  }
}
