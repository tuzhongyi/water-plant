import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';

export interface TreeRegionEditOutputArgs {
  value?: string;
  /** 操作对象结点（新增根节点时为空） */
  data?: RegionTreeNode;
}
