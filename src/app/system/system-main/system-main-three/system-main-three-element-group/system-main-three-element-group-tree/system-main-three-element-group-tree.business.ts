import { Injectable } from '@angular/core';
import { RegionTreeNode } from '../../../../../common/data-core/models/regions/region-tree-node.model';
import { RegionRequestService } from '../../../../../common/data-core/request/services/region/region.service';

@Injectable()
export class SystemMainThreeElementGroupTreeBusiness {
  constructor(private service: RegionRequestService) {}

  /**	区域树：摄像机分组的来源（区域结点做分组，资源结点与地图点位按 Id 配对） */
  region(): Promise<RegionTreeNode[]> {
    return this.service.tree.nodes();
  }
}
