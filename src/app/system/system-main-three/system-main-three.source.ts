import { Injectable } from '@angular/core';
import { MapElementType } from '../../common/data-core/enums/geo/map-element-type.enum';
import { EnumNameValue } from '../../common/data-core/models/capabilities/enum-name-value.model';
import { CapabilityTool } from '../../common/tools/capability-tool/capability.tool';

@Injectable()
export class SystemMainThreeSource {
  static elements = [
    MapElementType.Camera,
    MapElementType.Announciator,
    MapElementType.IoTSensor,
    MapElementType.Entrance,
  ];

  type = {
    all: [] as EnumNameValue<number>[],
    elements: [] as EnumNameValue<number>[],
  };

  constructor(private capability: CapabilityTool) {
    this.init.map.element();
  }

  private init = {
    map: {
      element: async () => {
        this.type.all = await this.capability.geographic.ElementTypes;

        this.type.elements = this.type.all.filter((x) => {
          return SystemMainThreeSource.elements.includes(x.Value);
        });
      },
    },
  };
}
