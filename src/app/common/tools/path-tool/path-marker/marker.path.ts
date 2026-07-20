import { MapElementType } from '../../../data-core/enums/geo/map-element-type.enum';
import { MarkerAnnounciatorPath } from './marker-announciator.path';
import { MarkerCameraPath } from './marker-camera.path';
import { MarkerDoorPath } from './marker-door.path';
import { MarkerSensorPath } from './marker-sensor.path';

export class MarkerPathTool {
  constructor(path: string = '') {
    this.basic = `${path}assets/images/map/marker`;
  }

  private basic: string;

  get camera() {
    return new MarkerCameraPath(`${this.basic}`);
  }
  get announciator() {
    return new MarkerAnnounciatorPath(`${this.basic}`);
  }
  get sensor() {
    return new MarkerSensorPath(`${this.basic}`);
  }
  get door() {
    return new MarkerDoorPath(`${this.basic}`);
  }

  get(type: MapElementType) {
    switch (type) {
      case MapElementType.Camera:
        return this.camera;
      case MapElementType.Announciator:
        return this.announciator;
      case MapElementType.IoTSensor:
        return this.sensor;
      case MapElementType.Entrance:
        return this.door;
      default:
        throw new Error('没找到MapElementType对映的图片');
    }
  }
}
