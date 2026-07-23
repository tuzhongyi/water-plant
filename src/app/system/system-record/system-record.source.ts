import { Injectable } from '@angular/core';
import { EnumNameValue } from '../../common/data-core/models/capabilities/enum-name-value.model';
import { ConfigRequestService } from '../../common/data-core/request/config/config-request.service';
import { CapabilityTool } from '../../common/tools/capability-tool/capability.tool';

@Injectable()
export class SystemRecordSource {
  types: EnumNameValue<number>[] = [];
  entrances: EnumNameValue<number>[] = [];
  loaded = false;

  constructor(
    private capability: CapabilityTool,
    private config: ConfigRequestService,
  ) {
    this.init.types();
  }

  private init = {
    types: async () => {
      let config = await this.config.get();

      let enabledtypes = [...config.event.device, ...config.event.alarm, ...config.event.other];
      let entrances = [...config.event.entrance];

      let types = await this.capability.event.EventTypes;

      this.types = types.filter((x) => enabledtypes.includes(x.Value));

      this.entrances = types.filter((x) => entrances.includes(x.Value));

      this.loaded = true;
    },
  };
}
