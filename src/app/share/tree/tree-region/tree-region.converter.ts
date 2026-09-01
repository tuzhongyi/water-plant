import { RegionResource } from '../../../common/data-core/models/regions/region-resource.model';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { Region } from '../../../common/data-core/models/regions/region.model';
import { FlatTreeNode } from '../component/tree.model';

export class TreeRegionConverter {
  /** tree 接口路径：RegionTreeNode 树 → 扁平结点列表 */
  flat(nodes: RegionTreeNode[]): FlatTreeNode[] {
    const result: FlatTreeNode[] = [];
    let index = 0;
    const add = (node: RegionTreeNode, parentId: string | undefined, level: number) => {
      const id = `region_${node.Id}_${index++}`;
      const children = this.sort(node.Children ?? []);
      result.push({
        id,
        label: node.Name || node.Id,
        level,
        parentId,
        expandable: children.length > 0,
        expanded: true,
        html: `<i class="hw-tree-icon ${this.icon(node)}"></i><span class="hw-tree-label">${node.Name || node.Id}</span>`,
        icon: this.icon(node),
        data: node,
      });
      for (const child of children) {
        add(child, id, level + 1);
      }
    };
    for (const node of nodes) {
      add(node, undefined, 0);
    }
    return result;
  }

  /** 筛选路径：Region → 区域扁平结点（data 为原始 Region） */
  region(data: Region, parentId: string | undefined, level: number): FlatTreeNode {
    return {
      id: `region_${data.Id}`,
      label: data.Name || data.Id,
      level,
      parentId,
      expandable: false,
      expanded: true,
      html: `<i class="hw-tree-icon ${this.regionIcon(data.RegionType)}"></i><span class="hw-tree-label">${data.Name || data.Id}</span>`,
      icon: this.regionIcon(data.RegionType),
      data,
    };
  }

  /** 筛选路径：RegionResource → 资源扁平结点（data 为原始 RegionResource） */
  resource(data: RegionResource, parentId: string | undefined, level: number): FlatTreeNode {
    return {
      id: `resource_${data.ResourceId}`,
      label: data.ResourceName || data.ResourceId,
      level,
      parentId,
      expandable: false,
      expanded: true,
      html: `<i class="hw-tree-icon ${this.resourceIcon(data.ResourceType)}"></i><span class="hw-tree-label">${data.ResourceName || data.ResourceId}</span>`,
      icon: this.resourceIcon(data.ResourceType),
      data,
    };
  }

  /* ---- 图标 ---- */

  /** 根据 RegionNodeType 判定 NodeType 的含义并映射图标 */
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

  /* ---- 排序 ---- */

  /** 子节点排序：类型（资源在前）→ 有无子节点（无子节点在前）→ 名称 */
  private sort(children: RegionTreeNode[]): RegionTreeNode[] {
    return [...children].sort((a, b) => {
      const type = this.order(a) - this.order(b);
      if (type !== 0) return type;
      // const leaf = this.leaf(a) - this.leaf(b);
      // if (leaf !== 0) return leaf;
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
}
