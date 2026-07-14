import { Injectable } from '@angular/core';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { ArrayTool } from '../../../common/tools/array-tool/array.tool';
import { CapabilityTool } from '../../../common/tools/capability-tool/capability.tool';

@Injectable()
export class TreeMapElementBusiness {
  constructor(
    private service: GeographicRequestService,
    private capability: CapabilityTool,
  ) {}

  types() {
    return this.capability.geographic.ElementTypes;
  }

  async load() {
    let datas = await this.data.load();
    let group = ArrayTool.groupBy(datas, (x) => {
      return x.ElementType;
    });
    return group;
  }

  private data = {
    load: () => {
      return this.service.map.element.all();
    },
  };
}
