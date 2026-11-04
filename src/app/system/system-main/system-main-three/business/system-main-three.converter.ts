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
import { PathTool } from '../../../../common/tools/path-tool/path.tool';
import { SystemMainThreeBusiness } from './system-main-three.business';

@Injectable()
export class SystemMainThreeConverter {
  constructor(
    private business: SystemMainThreeBusiness,
    private config: ConfigRequestService,
    private path: PathTool,
  ) {}

  default = 'VIL.glb';

  /**	元素绑定的设备状态：0-在线，1-离线；没绑定或查不到设备时 undefined */
  private device = {
    state: async (data: GeoMapElement): Promise<number | undefined> => {
      if (!data.ElementId) return undefined;
      return data.FromDB31
        ? await this.business.device.db31.state(data.ElementId)
        : await this.business.device.video.state(data.ElementId);
    },
  };

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
        let state = data.ElementState;
        let offline = state == 1;
        /*	这里的报警只决定 marker 的显示颜色（红），不触发报警业务、不向建筑扩散 */
        let alarm = state == 2 || this.business.element.alarm.has(data.Id);
        let alarmdiffusion = true;
        if (state === undefined) {
          /*	元素没有状态时按绑定的设备判断在线/离线；
              设备不存在（没绑定或查不到）则标记为报警（红色），同样只影响显示 */
          let devicestate = await this.device.state(data);
          if (devicestate === undefined) {
            /* 设备不存在不是真实报警，只标红，不播放报警扩散动画 */
            if (!alarm) {
              alarm = true;
              alarmdiffusion = false;
            }
          } else {
            offline = devicestate == 1;
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
          icon: marker.get(data.ElementType),
          offline: offline,
          error: alarm,
          alarm: alarmdiffusion,
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
