import { RoadObjectEventType } from '../../../../../data-core/enums/road/road-object/road-object-event-type.enum';
import { RoadObjectState } from '../../../../../data-core/enums/road/road-object/road-object-state.enum';
import { RoadObjectType } from '../../../../../data-core/enums/road/road-object/road-object-type.enum';
import { IMapMarkerPath } from '../map-marker.interface';
import { MapMarkerObjectBusStationPath } from './map-marker-object-bus-station.path';
import { MapMarkerObjectCycleLaneSeparatorPath } from './map-marker-object-cycle-lane-separator.path';
import { MapMarkerObjectFireHydrantPath } from './map-marker-object-fire-hydrant.path';
import { MapMarkerObjectNoParkingPath } from './map-marker-object-no-parking.path';
import { MapMarkerObjectPassagePath } from './map-marker-object-passage.path';
import { MapMarkerObjectPublicityWallPath } from './map-marker-object-publicity-wall.path';
import { MapMarkerObjectTelephoneBoothPath } from './map-marker-object-telephone-booth.path';
import { MapMarkerObjectTrashCanPath } from './map-marker-object-trash-can.path';
import { MapMarkerObjectUnknowPath } from './map-marker-object-unknow.path';
import { IMapMarkerObjectPath } from './map-marker-object.interface';

export class MapMarkerObjectPath {
  constructor(path: string) {
    this.basic = `${path}`;
  }

  private basic: string;

  get passage() {
    return new MapMarkerObjectPassagePath(this.basic);
  }
  get busstation() {
    return new MapMarkerObjectBusStationPath(this.basic);
  }
  get firehydrant() {
    return new MapMarkerObjectFireHydrantPath(this.basic);
  }
  get trashcan() {
    return new MapMarkerObjectTrashCanPath(this.basic);
  }
  get unknow() {
    return new MapMarkerObjectUnknowPath(this.basic);
  }
  get telephonebooth() {
    return new MapMarkerObjectTelephoneBoothPath(this.basic);
  }
  get cyclelaneseparator() {
    return new MapMarkerObjectCycleLaneSeparatorPath(this.basic);
  }
  get noparking() {
    return new MapMarkerObjectNoParkingPath(this.basic);
  }
  get publicitywall() {
    return new MapMarkerObjectPublicityWallPath(this.basic);
  }

  get(
    type?: RoadObjectType,
    args?: {
      state?: RoadObjectState;
      event?: RoadObjectEventType;
      start?: boolean;
    }
  ) {
    let path = this.from.type(type, args?.start);

    if (path instanceof IMapMarkerObjectPath) {
      if (args) {
        if (args.state != undefined) {
          switch (args.state) {
            case RoadObjectState.Normal:
              return path.cyan;
            case RoadObjectState.Breakage:
              return path.orange;
            case RoadObjectState.Disappear:
              return path.red;
            case RoadObjectState.None:
              return path.green;
            default:
              return path.green;
          }
        }
        if (args.event != undefined) {
          switch (args.event) {
            case RoadObjectEventType.Inspection:
              return path.green;
            case RoadObjectEventType.Breakage:
              return path.orange;
            case RoadObjectEventType.Disappear:
              return path.red;
            default:
              return path.gray;
          }
        }
      }
    }

    return this.unknow.gray;
  }

  private from = {
    type: (
      type?: RoadObjectType,
      start?: boolean
    ): IMapMarkerObjectPath | IMapMarkerPath => {
      switch (type) {
        case RoadObjectType.BusStation:
          return this.busstation;
        case RoadObjectType.FireHydrant:
          return this.firehydrant;
        case RoadObjectType.Passage:
          return this.passage;
        case RoadObjectType.TrashCan:
          return this.trashcan;
        case RoadObjectType.TelephoneBooth:
          return this.telephonebooth;
        case RoadObjectType.CycleLaneSeparator:
          return start
            ? this.cyclelaneseparator.start
            : this.cyclelaneseparator.end;
        case RoadObjectType.NoParking:
          return start ? this.noparking.start : this.noparking.end;
        case RoadObjectType.PublicityWall:
          return start ? this.publicitywall.start : this.publicitywall.end;
        default:
          return this.unknow.gray;
      }
    },
  };
}
