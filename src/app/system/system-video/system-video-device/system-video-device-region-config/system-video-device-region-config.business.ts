import { Injectable } from '@angular/core';
import { VideoChannel } from '../../../../common/data-core/models/devices/video-channel.model';
import { RegionResource } from '../../../../common/data-core/models/regions/region-resource.model';
import { Region } from '../../../../common/data-core/models/regions/region.model';
import { GetVideoChannelsParams } from '../../../../common/data-core/request/services/device/device.params';
import { DeviceRequestService } from '../../../../common/data-core/request/services/device/device.service';
import { GetRegionResourcesParams } from '../../../../common/data-core/request/services/region/region.params';
import { RegionRequestService } from '../../../../common/data-core/request/services/region/region.service';

@Injectable()
export class SystemVideoDeviceRegionConfigBusiness {
  constructor(region: RegionRequestService, device: DeviceRequestService) {
    this.service = { region, device };
  }

  private service: {
    region: RegionRequestService;
    device: DeviceRequestService;
  };

  region = {
    root: (text: string) => {
      let region = new Region();
      region.Id = '';
      region.Name = text;
      region.CreationTime = new Date();
      region.UpdateTime = new Date();
      region.RegionType = 1;
      region.Sort = 1;
      return this.service.region.create(region);
    },
    create: (parent: { Id: string; Sort: number }, text: string) => {
      let region = new Region();
      region.Id = '';
      region.Name = text;
      region.CreationTime = new Date();
      region.UpdateTime = new Date();
      region.ParentId = parent.Id;
      region.RegionType = 1;
      region.Sort = parent.Sort + 1;
      return this.service.region.create(region);
    },
    update: (id: string, text: string) => {
      return this.service.region.get(id).then((region) => {
        region.Name = text;
        region.UpdateTime = new Date();
        return this.service.region.update(region);
      });
    },
    delete: (id: string) => {
      return this.service.region.delete(id);
    },
    /**
     * 同步资源名称：以摄像机通道名称为准，把区域资源里名称不一致的改成一致
     * @returns 修改成功 / 失败的数量
     */
    syncname: async () => {
      const params = new GetRegionResourcesParams();
      /* 资源类型 1：视频通道 */
      params.ResourceType = 1;
      const resources = await this.service.region.resource.all(params);
      const count = { success: 0, error: 0 };
      if (resources.length === 0) return count;

      const channelParams = new GetVideoChannelsParams();
      channelParams.Ids = resources.map((x) => x.ResourceId);
      const channels = await this.service.device.video.channel.all(channelParams);
      const names = new Map<string, string>(channels.map((x) => [x.Id, x.Name]));

      for (const resource of resources) {
        const name = names.get(resource.ResourceId);
        /* 通道不存在则保留原名，名称已一致则跳过 */
        if (name === undefined || name === resource.ResourceName) continue;

        resource.ResourceName = name;
        try {
          await this.service.region.resource.update(resource);
          count.success++;
        } catch {
          count.error++;
        }
      }
      return count;
    },
  };
  resource = {
    create: (parent: { Id: string; Sort: number }, data: VideoChannel) => {
      let resource = new RegionResource();
      resource.RegionId = parent.Id;
      resource.ResourceId = data.Id;
      resource.ResourceName = data.Name;
      resource.Sort = parent.Sort + 1;
      resource.ResourceType = 1;
      resource.Description = data.Description;
      return this.service.region.resource.create(resource);
    },
    delete: (regionId: string, resourceId: string) => {
      return this.service.region.resource.delete(regionId, resourceId);
    },
  };
}
