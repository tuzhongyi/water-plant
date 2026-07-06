import { Injectable } from '@angular/core';
import {
  MarkerEntity,
  ModelFile,
  ModelViewerModel,
} from '../../../common/components/three-dimension/business/models/types';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { PathTool } from '../../../common/tools/path-tool/path.tool';
import { SettingMapBusiness } from '../business/setting-map.business';

@Injectable()
export class SettingMapThreeConverter {
  constructor(private business: SettingMapBusiness) {}

  default = 'VIL.glb';

  private get = {
    building: async (parentId: string): Promise<GeoMapElement | undefined> => {
      let element = await this.business.element.get(parentId);
      switch (element.ElementType) {
        case MapElementType.Building:
          return element;
        case MapElementType.Floor:
          if (element.ParentId) {
            return this.get.building(element.ParentId);
          }
          break;
        default:
          break;
      }
      return undefined;
    },
  };

  element = {
    to: {
      camera: async (data: GeoMapElement): Promise<MarkerEntity> => {
        let building: GeoMapElement | undefined = undefined;
        let modelId = this.default;
        if (data.ParentId) {
          building = await this.get.building(data.ParentId);
          if (building && building?.ElementId) {
            modelId = this.model.to.expansion(building.ElementId);
          }
        }

        let entity: MarkerEntity = {
          id: data.Id,
          name: data.Name,
          position: {
            x: data.Location?.Longitude || 0,
            z: data.Location?.Latitude || 0,
            y: data.Location?.Altitude || 0,
          },
          modelId: modelId,
          icon: PathTool.marker.get(data.ElementType),
          data: data,
        };
        return entity;
      },
      building: (data: GeoMapElement): ModelViewerModel => {
        let filename = data.ElementId;

        if (!filename) throw new Error('未绑定建筑');

        let model: ModelViewerModel = {
          id: data.Id,
          fileName: filename,
          label: data.Name,
          url: PathTool.three.get.glb(filename),
        };
        return model;
      },
    },
  };

  map = {
    to: {
      village: (data: GeoMap): ModelViewerModel => {
        let filename = data.FileUrl ?? this.default;
        let model: ModelViewerModel = {
          id: data.Id,
          fileName: filename,
          label: data.Name,
          url: PathTool.three.get.glb(filename),
        };
        return model;
      },
    },
  };

  model = {
    from: {
      file: (file: ModelFile, element: GeoMapElement) => {
        let model: ModelViewerModel = {
          id: element.Id,
          fileName: file.name,
          label: element.Name,
          url: PathTool.three.get.glb(file.name),
        };
        return model;
      },
      expansion: (filename: string) => {
        // 1. 分割 文件名主体 和 后缀（以第一个.分割）
        const dotIndex = filename.lastIndexOf('.');
        // 无小数点直接原样返回
        if (dotIndex === -1) return filename;

        const nameBody = filename.slice(0, dotIndex);
        const ext = filename.slice(dotIndex);

        // 2. 按下划线拆分主体，移除最后一段
        const nameParts = nameBody.split('_');
        // 防止只有一段的边界情况
        if (nameParts.length <= 1) return filename;

        const newBody = nameParts.slice(0, -1).join('_');
        return newBody + ext;
      },
    },
    to: {
      expansion: (modelId: string) => {
        const dot = modelId.lastIndexOf('.');
        const base = dot > 0 ? modelId.substring(0, dot) : modelId;
        const ext = dot > 0 ? modelId.substring(dot) : '';
        return `${base}_expansion${ext}`;
      },
    },
  };
}
