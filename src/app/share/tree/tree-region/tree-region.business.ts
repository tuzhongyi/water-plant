import { Injectable } from '@angular/core';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { RegionRequestService } from '../../../common/data-core/request/services/region/region.service';

@Injectable()
export class TreeRegionBusiness {
  constructor(private service: RegionRequestService) {}

  load(): Promise<RegionTreeNode[]> {
    return this.service.tree.nodes();
  }
}
