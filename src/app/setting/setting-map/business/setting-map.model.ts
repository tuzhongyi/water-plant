import { ModelFile } from '../../../common/components/three-dimension/business/models/types';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { IIdNameModel } from '../../../common/data-core/models/interface/model.interface';

export class MapModel extends GeoMap {
  file?: ModelFile;
}

export class MapElementModel extends GeoMapElement {
  file?: ModelFile;
}
export interface BindingArgs {
  location: { x: number; y: number; z: number };
  standby: IIdNameModel;
  parent?: GeoMapElement;
}
export class BuildingModel {}
