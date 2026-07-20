import { MapElementType } from '../../../data-core/enums/geo/map-element-type.enum';

export class MapElementTypeConverterTool {
  from = {
    DeviceResourceType: (value: number) => {
      switch (value) {
        case 1:
          return MapElementType.Camera;
        case 2:
          return MapElementType.Announciator;
        case 3:
          return MapElementType.Entrance;

        case 4:
          return MapElementType.IoTSensor;
        default:
          throw new Error(`MapElementType convert from DeviceResourceType unknow type:${value}`);
      }
    },
    DeviceType: (value: number) => {
      switch (value) {
        case 1:
          return MapElementType.Camera;
        default:
          throw new Error(`MapElementType convert from DeviceType unknow type:${value}`);
      }
    },
    DB31DeviceType: (value: number) => {
      switch (value) {
        case 1:
          return MapElementType.Announciator;
        case 2:
          return MapElementType.Entrance;
        case 3:
          return MapElementType.IoTSensor;
        default:
          throw new Error(`MapElementType convert from DB31DeviceType unknow type:${value}`);
      }
    },
  };
}
