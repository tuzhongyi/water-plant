import { Injectable } from '@angular/core';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { NameValue } from '../../../common/data-core/models/capabilities/enum-name-value.model';
import { EnumTool } from '../../../common/tools/enum-tool/enum.tool';
import { Language } from '../../../common/tools/language-tool/language';

@Injectable()
export class SettingMapElementSource {
  types: NameValue<number>[] = [];

  constructor() {
    this.init.map.element();
  }

  private init = {
    map: {
      element: () => {
        let enums = EnumTool.values(MapElementType);
        this.types = enums.map((x) => {
          let nv = new NameValue<number>();
          nv.Name = Language.MapElementType(x);
          nv.Value = x;
          return nv;
        });
      },
    },
  };
}
