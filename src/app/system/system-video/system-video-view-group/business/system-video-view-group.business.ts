import { Injectable } from '@angular/core';
import { VideoChannelViewGroup } from '../../../../common/data-core/models/devices/video-channel-view-group.model';
import { GetVideoChannelViewGroupsParams } from '../../../../common/data-core/request/services/device/device.params';
import { DeviceRequestService } from '../../../../common/data-core/request/services/device/device.service';
import { SystemVideoViewGroupArgs } from './system-video-view-group.model';

@Injectable()
export class SystemVideoViewGroupBusiness {
  constructor(private service: DeviceRequestService) {}

  save(data: VideoChannelViewGroup) {
    data.Id = '';
    return this.service.viewGroup.create(data);
  }

  load(args: SystemVideoViewGroupArgs) {
    let params = new GetVideoChannelViewGroupsParams();
    params.Name = args.name;
    return this.service.viewGroup.all(params);
  }

  get(id: string) {
    return this.service.viewGroup.get(id);
  }
  delete(id: string) {
    return this.service.viewGroup.delete(id);
  }
  update(data: VideoChannelViewGroup) {
    return this.service.viewGroup.update(data);
  }
}
