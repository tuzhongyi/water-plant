import { Injectable } from '@angular/core';
import { LabelMode } from '../../common/components/three-dimension/business/models/types';
import { MapElementType } from '../../common/data-core/enums/geo/map-element-type.enum';
import { EnumNameValue } from '../../common/data-core/models/capabilities/enum-name-value.model';
import { IIdNameModel } from '../../common/data-core/models/interface/model.interface';
import { GetMapElementsParams } from '../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../common/data-core/request/services/geographic/geographic.service';
import { ArrayTool } from '../../common/tools/array-tool/array.tool';
import { CapabilityTool } from '../../common/tools/capability-tool/capability.tool';
import { LocaleCompare } from '../../common/tools/compare-tool/compare.tool';
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

  loaded = false;

  labelmodes: EnumNameValue[] = [];

  buildings: IIdNameModel[] = [];

  constructor(
    private capability: CapabilityTool,
    private service: GeographicRequestService,
  ) {
    this.init.map.element();
    this.init.labelmode();
    this.init.building();
  }

  private get = {
    floors: () => {
      let params = new GetMapElementsParams();
      params.ElementTypes = [MapElementType.Floor];
      return this.service.map.element.cache.all(params);
    },
  };

  private init = {
    building: async () => {
      let floors = await this.get.floors();
      let buildingIds = floors.filter((x) => !!x.ParentId).map((x) => x.ParentId!);

      let params = new GetMapElementsParams();
      params.ElementTypes = [MapElementType.Building];
      params.Ids = ArrayTool.unique(buildingIds);
      this.buildings = await this.service.map.element.cache.all(params);
      this.buildings = this.buildings.sort((a, b) => {
        return LocaleCompare.compare(a.Name, b.Name);
      });
    },
    map: {
      element: async () => {
        this.type.all = await this.capability.geographic.ElementTypes;

        this.type.elements = this.type.all.filter((x) => {
          return SystemMainThreeSource.elements.includes(x.Value);
        });
        this.loaded = true;
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
