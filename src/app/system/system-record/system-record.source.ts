import { Injectable } from '@angular/core';
import { EnumNameValue } from '../../common/data-core/models/capabilities/enum-name-value.model';
import { CapabilityTool } from '../../common/tools/capability-tool/capability.tool';

@Injectable()
export class SystemRecordSource {
  types: EnumNameValue<number>[] = [];

  constructor(private capability: CapabilityTool) {
    this.init.types();
  }

  private init = {
    types: async () => {
      let enabledtypes = [1, 2, 101, 102];
      this.types = (await this.capability.event.EventTypes).filter((x) =>
        enabledtypes.includes(x.Value),
      );
    },
  };
}
