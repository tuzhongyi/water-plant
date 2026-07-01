import { MapElementType } from '../../../../common/data-core/enums/geo/map-element-type.enum';
import { IIdNameModel } from '../../../../common/data-core/models/interface/model.interface';

export interface SettingMapElementDetailsArgs {
  mapId: string;
  type?: MapElementType;
  parent: IIdNameModel;
}
