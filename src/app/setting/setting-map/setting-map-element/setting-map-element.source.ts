import { Injectable } from '@angular/core';
import { EnumNameValue } from '../../../common/data-core/models/capabilities/enum-name-value.model';
import { CapabilityTool } from '../../../common/tools/capability-tool/capability.tool';

@Injectable()
export class SettingMapElementSource {
  types: EnumNameValue<number>[] = [];

  constructor(private capability: CapabilityTool) {
    this.init.map.element();
  }

  private init = {
    map: {
      element: async () => {
        this.types = await this.capability.geographic.ElementTypes;
      },
    },
  };
}
