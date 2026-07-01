import {
  CameraEntity,
  ModelViewerModel,
} from '../../../common/components/three-dimension/business/models/types';
import { PathTool } from '../../../common/tools/path-tool/path.tool';
import { MapElementModel, MapModel } from '../business/setting-map.model';

export class SettingMapThreeConverter {
  default = 'VIL.glb';
  to = {
    camera: (data: MapElementModel): CameraEntity => {
      let entity: CameraEntity = {
        id: data.Id,
        name: data.Name,
        position: {
          x: data.Location?.Longitude || 0,
          z: data.Location?.Latitude || 0,
          y: data.Location?.Altitude || 0,
        },
        modelId: data.file?.name ?? this.default,
      };
      return entity;
    },
    building: (data: MapElementModel): ModelViewerModel => {
      let filename = data.file ? data.file.name : 'Administration_Complex.glb';
      let model: ModelViewerModel = {
        id: data.Id,
        fileName: filename,
        label: data.Name,
        url: PathTool.three.get.glb(filename),
      };
      return model;
    },
    village: (data: MapModel): ModelViewerModel => {
      let filename = data.FileUrl ?? this.default;
      let model: ModelViewerModel = {
        id: data.Id,
        fileName: filename,
        label: data.Name,
        url: PathTool.three.get.glb(filename),
      };
      return model;
    },
  };
}
