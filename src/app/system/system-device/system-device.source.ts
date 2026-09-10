import { KeyValue } from '@angular/common';
import { Injectable } from '@angular/core';
import { EnumNameValue } from '../../common/data-core/models/capabilities/enum-name-value.model';
import { CapabilityTool } from '../../common/tools/capability-tool/capability.tool';

@Injectable()
export class SystemDeviceSource {
  types: EnumNameValue<KeyValue<boolean, number>>[] = [];
  states: EnumNameValue<number>[] = [];

  constructor(private capability: CapabilityTool) {
    this.init();
  }

  private async init() {
    this.capability.device.DeviceStates.then((x) => {
      this.states = x;
    });
    let device = await this.capability.device.DeviceTypes;
    let db31 = await this.capability.db31.DeviceTypes;

    this.types = [];
    device.forEach((x) => {
      let item: EnumNameValue<KeyValue<boolean, number>> = {
        Value: {
          key: false,
          value: x.Value,
        },
        Name: x.Name,
      };
      this.types.push(item);
    });
    db31.forEach((x) => {
      let item: EnumNameValue<KeyValue<boolean, number>> = {
        Value: {
          key: true,
          value: x.Value,
        },
        Name: x.Name,
      };
      this.types.push(item);
    });
  }
}
