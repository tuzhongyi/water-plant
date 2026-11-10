import { Injectable } from '@angular/core';
import {
  MarkerEntity,
  ModelFile,
  ModelViewerModel,
} from '../../../../common/components/three-dimension/business/models/types';
import { MapElementType } from '../../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../../common/data-core/models/geographic/map.model';
import { ConfigRequestService } from '../../../../common/data-core/request/config/config-request.service';
import { ElementStateTool } from '../../../../common/tools/element-state-tool/element-state.tool';
import { PathTool } from '../../../../common/tools/path-tool/path.tool';
import { SystemMainThreeBusiness } from './system-main-three.business';

@Injectable()
export class SystemMainThreeConverter {
  constructor(
    private business: SystemMainThreeBusiness,
    private config: ConfigRequestService,
    private path: PathTool,
    private elementstate: ElementStateTool,
  ) {}

  default = 'VIL.glb';

  private get = {
    building: async (parentId: string): Promise<GeoMapElement | undefined> => {
      let element = await this.business.element.get.by.id(parentId);
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
      marker: async (data: GeoMapElement): Promise<MarkerEntity> => {
        let building: GeoMapElement | undefined = undefined;
        let modelId = this.default;
        let config = await this.config.map;
        let marker = await this.path.marker;
        if (data.ParentId) {
          building = await this.get.building(data.ParentId);
          if (building && building?.ElementId) {
            modelId = this.model.to.expansion(building.ElementId);
          }
        }
        /*	状态口径与统计面板 / 元素列表一致（统一走 ElementStateTool）：
            0-正常，1-离线，2-报警；DB31 元素取不到 ElementState 时按父设备状态，
            其他查不到状态的按离线（灰）显示 */
        let state = await this.elementstate.state(data);
        let offline = this.elementstate.offline(state);
        /*	这里的报警只决定 marker 的显示颜色（红），不触发报警业务、不向建筑扩散 */
        let alarm = this.elementstate.alarm(state) || this.business.element.alarm.has(data.Id);

        let entity: MarkerEntity = {
          id: data.Id,
          name: data.Name,
          position: {
            x: data.Location?.Longitude || 0,
            z: data.Location?.Latitude || 0,
            y: data.Location?.Altitude || 0,
          },
          modelId: modelId,
          icon: marker.get(data.ElementType),
          offline: offline,
          error: alarm,
          /* 报警扩散动画：error 为 true 时才可能创建，保持默认的播放 */
          alarm: alarm,
          data: data,
          viewfield: {
            ...config.viewfield,
            enabled: data.ElementType == MapElementType.Camera,
            course: data.Location?.Course,
          },
        };

        return entity;
      },
      building: (data: GeoMapElement, mode: string): ModelViewerModel => {
        let filename = data.ElementId;

        if (!filename) throw new Error('未绑定建筑');

        let model: ModelViewerModel = {
          id: data.Id,
          fileName: filename,
          label: data.Name,
          url: PathTool.three.get.file(mode, filename),
          alarm: this.business.element.alarm.has(data.Id),
        };
        return model;
      },
    },
  };

  map = {
    to: {
      village: (data: GeoMap, mode: string): ModelViewerModel => {
        let filename = data.FileUrl ?? this.default;
        let model: ModelViewerModel = {
          id: data.Id,
          fileName: filename,
          label: data.Name,
          url: PathTool.three.get.file(mode, filename),
        };
        return model;
      },
    },
  };

  model = {
    from: {
      file: (file: ModelFile, element: GeoMapElement, mode: string) => {
        let model: ModelViewerModel = {
          id: element.Id,
          fileName: file.name,
          label: element.Name,
          url: PathTool.three.get.file(mode, file.name),
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
