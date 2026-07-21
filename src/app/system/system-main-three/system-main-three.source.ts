import { Injectable } from '@angular/core';
import { LabelMode } from '../../common/components/three-dimension/business/models/types';
import { MapElementType } from '../../common/data-core/enums/geo/map-element-type.enum';
import { EnumNameValue } from '../../common/data-core/models/capabilities/enum-name-value.model';
import { CapabilityTool } from '../../common/tools/capability-tool/capability.tool';
import { EnumTool } from '../../common/tools/enum-tool/enum.tool';
import { Language } from '../../common/tools/language-tool/language';

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

  labelmodes: EnumNameValue[] = [];

  constructor(private capability: CapabilityTool) {
    this.init.map.element();
    this.init.labelmode();
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
    labelmode: () => {
      let values = EnumTool.values(LabelMode);
      this.labelmodes = values.map((x) => ({
        Value: x,
        Name: Language.ThreeDLabelMode(x),
      }));
    },
  };
}
