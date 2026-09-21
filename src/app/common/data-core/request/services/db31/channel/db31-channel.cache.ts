import { DB31Channel } from '../../../../models/db31/db31-channel.model';
import { IService } from '../../../cache/cache.interface';
import { ServiceCache } from '../../../cache/service.cache';
import { GetDB31DeviceChannelsParams } from './db31-channel.params';

export class DB31ChannelServiceCache extends ServiceCache<DB31Channel> {
  constructor(key: string, service: IService<DB31Channel>) {
    super(key, service, DB31Channel);

    this.timeout = 60 * 1000;
  }

  override filter(datas: DB31Channel[], params: GetDB31DeviceChannelsParams): DB31Channel[] {
    if (params.Ids && params.Ids.length > 0) {
      datas = datas.filter((x) => params.Ids!.includes(x.Id));
    }
    if (params.Name) {
      datas = datas.filter((x) => x.Name && x.Name.includes(params.Name!));
    }
    if (params.DeviceId) {
      datas = datas.filter((x) => x.DeviceId == params.DeviceId);
    }
    if (params.DB31Id) {
      datas = datas.filter((x) => x.DB31Id == params.DB31Id);
    }
    if (params.ChannelNo !== undefined) {
      datas = datas.filter((x) => x.ChannelNo == params.ChannelNo);
    }

    return datas;
  }
}
