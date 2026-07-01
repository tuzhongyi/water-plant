import { MapElementType } from '../../data-core/enums/geo/map-element-type.enum';

export class IconTool {
  static MapElementType(value?: MapElementType) {
    switch (value) {
      case MapElementType.Range:
        return '';
      case MapElementType.Building:
        return 'howell-icon-Building';
      case MapElementType.House:
        return 'howell-icon-home';
      case MapElementType.Camera:
        return 'howell-icon-video';
      case MapElementType.Door:
        return 'howell-icon-door-state';
      case MapElementType.Entrance:
        return 'howell-icon-Entrance';
      case MapElementType.Floor:
        return 'howell-icon-Floor';
      case MapElementType.IoTSensor:
        return 'howell-icon-Sensor';
      case MapElementType.Announciator:
        return 'howell-icon-Announciator';

      default:
        return '';
    }
  }

  static DeviceType(value?: number) {
    switch (value) {
      case 1:
        return 'howell-icon-camera_line';
      case 2:
        return 'howell-icon-device_line';
      default:
        return '';
    }
  }
}
