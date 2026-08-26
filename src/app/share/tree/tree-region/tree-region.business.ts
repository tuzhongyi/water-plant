import { Injectable } from '@angular/core';
import { RegionResource } from '../../../common/data-core/models/regions/region-resource.model';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { Region } from '../../../common/data-core/models/regions/region.model';
import { GetRegionResourcesParams } from '../../../common/data-core/request/services/region/region.params';
import { RegionRequestService } from '../../../common/data-core/request/services/region/region.service';
import { FlatTreeNode } from '../component/tree.model';
import { TreeRegionConverter } from './tree-region.converter';
import { TreeRegionArgs } from './tree-region.model';

@Injectable()
export class TreeRegionBusiness {
  constructor(private service: RegionRequestService) {}

  private converter = new TreeRegionConverter();

  async load(args: TreeRegionArgs): Promise<FlatTreeNode[]> {
    if (args.name) {
      return this.list(args);
    }
    const nodes = await this.tree();
    return this.converter.flat(nodes);
  }

  /** 筛选：搜索资源 → 追溯上级区域 → 直接组成扁平树 */
  private async list(args: TreeRegionArgs): Promise<FlatTreeNode[]> {
    const resources = await this.resource(args);
    if (!resources || resources.length === 0) return [];
    return this.buildFromResources(resources);
  }

  private resource(args: TreeRegionArgs): Promise<RegionResource[]> {
    let params = new GetRegionResourcesParams();
    params.Name = args.name;
    params.ResourceType = 1;
    return this.service.resource.all(params);
  }

  private parent(id: string): Promise<Region> {
    return this.service.get(id);
  }

  private tree(): Promise<RegionTreeNode[]> {
    return this.service.tree.nodes();
  }

  /** 由匹配到的资源向上追溯父级区域，直接拼装扁平结点列表 */
  private async buildFromResources(resources: RegionResource[]): Promise<FlatTreeNode[]> {
    const regionCache = new Map<string, Region>();
    const nodeCache = new Map<string, FlatTreeNode>();
    const nodes: FlatTreeNode[] = [];

    const regionOf = async (id: string): Promise<Region> => {
      let region = regionCache.get(id);
      if (!region) {
        region = await this.parent(id);
        regionCache.set(id, region);
      }
      return region;
    };

    const ensureRegion = (
      region: Region,
      parent: FlatTreeNode | undefined,
      level: number,
    ): FlatTreeNode => {
      let node = nodeCache.get(region.Id);
      if (!node) {
        node = this.converter.region(region, parent?.id, level);
        nodeCache.set(region.Id, node);
        nodes.push(node);
        if (parent) parent.expandable = true;
      }
      return node;
    };

    for (const resource of resources) {
      if (!resource.RegionId) continue;
      // 从资源所属区域向上追溯，得到 [root, ..., 直接上级] 区域链
      const chain: Region[] = [];
      let id: string | undefined = resource.RegionId;
      while (id) {
        const region = await regionOf(id);
        chain.unshift(region);
        id = region.ParentId;
      }
      // 逐级创建/复用区域结点
      let parent: FlatTreeNode | undefined;
      chain.forEach((region, i) => {
        parent = ensureRegion(region, parent, i);
      });
      // 资源结点挂在直接上级区域下
      nodes.push(this.converter.resource(resource, parent?.id, chain.length));
      if (parent) parent.expandable = true;
    }

    return nodes;
  }
}
