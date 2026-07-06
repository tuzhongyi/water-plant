import { MapElementType } from '../../data-core/enums/geo/map-element-type.enum';

export interface MapImagePath {
  normal: string;
  hover: string;
  selected: string;
  offline: string;
  alarm?: {
    normal: string;
    hover?: string;
    selected?: string;
    offline?: string;
  };
}

export class PathImageMapTool {
  camera: MapImagePath = {
    normal: '/assets/images/map/marker/camera.png',
    hover: '/assets/images/map/marker/camera-hover.png',
    selected: '/assets/images/map/marker/camera-selected.png',
    offline: '/assets/images/map/marker/camera-offline.png',
    alarm: {
      normal: '/assets/images/map/marker/camera-alarm.png',
      hover: '/assets/images/map/marker/camera-alarm-hover.png',
      selected: '/assets/images/map/marker/camera-alarm-selected.png',
    },
  };
  announciator: MapImagePath = {
    normal: '/assets/images/map/marker/announciator.png',
    hover: '/assets/images/map/marker/announciator-hover.png',
    selected: '/assets/images/map/marker/announciator-selected.png',
    offline: '/assets/images/map/marker/announciator-offline.png',
    alarm: {
      normal: '/assets/images/map/marker/announciator-alarm.png',
      hover: '/assets/images/map/marker/announciator-alarm-hover.png',
      selected: '/assets/images/map/marker/announciator-alarm-selected.png',
    },
  };
  sensor: MapImagePath = {
    normal: '/assets/images/map/marker/sensor.png',
    hover: '/assets/images/map/marker/sensor-hover.png',
    selected: '/assets/images/map/marker/sensor-selected.png',
    offline: '/assets/images/map/marker/sensor-offline.png',
    alarm: {
      normal: '/assets/images/map/marker/sensor-alarm.png',
      hover: '/assets/images/map/marker/sensor-alarm-hover.png',
      selected: '/assets/images/map/marker/sensor-alarm-selected.png',
    },
  };

  get(type: MapElementType) {
    switch (type) {
      case MapElementType.Camera:
        return this.camera;
      case MapElementType.Announciator:
        return this.announciator;
      case MapElementType.IoTSensor:
        return this.sensor;
      default:
        throw new Error('没找到MapElementType对映的图片');
    }
  }
}
