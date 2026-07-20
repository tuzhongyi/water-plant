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
        return 'howell-icon-camera_line';
      case MapElementType.Door:
        return 'howell-icon-access_door';
      case MapElementType.Entrance:
        return 'howell-icon-access_door';
      case MapElementType.Floor:
        return 'howell-icon-Floor';
      case MapElementType.IoTSensor:
        return 'howell-icon-sensor_line';
      case MapElementType.Announciator:
        return 'howell-icon-alarm_line';
      default:
        return '';
    }
  }

  static DeviceType(value?: number, db31 = false) {
    if (db31) {
      switch (value) {
        case 1:
          return 'howell-icon-alarm_line';
        case 2:
          return 'howell-icon-access_door';
        case 3:
          return 'howell-icon-sensor_line';
        default:
          return '';
      }
    }
    switch (value) {
      case 1:
        return 'howell-icon-camera_line';
      case 2:
        return 'howell-icon-device_line';
      default:
        return '';
    }
  }
  static DeviceEventResource(value?: number) {
    switch (value) {
      case 1:
        return 'howell-icon-camera_line';
      case 2:
        return 'howell-icon-alarm_line';
      case 3:
        return 'howell-icon-access_door';
      case 4:
        return 'howell-icon-sensor_line';
      default:
        return '';
    }
  }
}
