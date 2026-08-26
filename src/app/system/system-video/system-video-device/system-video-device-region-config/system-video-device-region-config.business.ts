import { Injectable } from '@angular/core';
import { VideoChannel } from '../../../../common/data-core/models/devices/video-channel.model';
import { RegionResource } from '../../../../common/data-core/models/regions/region-resource.model';
import { Region } from '../../../../common/data-core/models/regions/region.model';
import { RegionRequestService } from '../../../../common/data-core/request/services/region/region.service';

@Injectable()
export class SystemVideoDeviceRegionConfigBusiness {
  constructor(private service: RegionRequestService) {}

  region = {
    root: (text: string) => {
      let region = new Region();
      region.Id = '';
      region.Name = text;
      region.CreationTime = new Date();
      region.UpdateTime = new Date();
      region.RegionType = 1;
      region.Sort = 1;
      return this.service.create(region);
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
      return this.service.create(region);
    },
    update: (id: string, text: string) => {
      return this.service.get(id).then((region) => {
        region.Name = text;
        region.UpdateTime = new Date();
        return this.service.update(region);
      });
    },
    delete: (id: string) => {
      return this.service.delete(id);
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
      return this.service.resource.create(resource);
    },
    delete: (regionId: string, resourceId: string) => {
      return this.service.resource.delete(regionId, resourceId);
    },
  };
}
