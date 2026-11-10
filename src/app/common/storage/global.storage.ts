import { Injectable } from '@angular/core';
import { IdAndName } from '../data-core/models/common/id-name.model';
import { UserGroup } from '../data-core/models/security/user/user-group.model';
import { User } from '../data-core/models/security/user/user.model';
import { ConfigRequestService } from '../data-core/request/config/config-request.service';
import { GetRegionResourcesParams } from '../data-core/request/services/region/region.params';
import { RegionRequestService } from '../data-core/request/services/region/region.service';
import { SecurityRequestService } from '../data-core/request/services/security/security.service';
import { LocationTool } from '../tools/location.tool';
import { PromiseValue } from '../tools/value-tool/value.promise';
import { SkinType } from './config-skin-storage/config-skin-storage.model';
import { LocalStorage } from './local.storage';

@Injectable({
  providedIn: 'root',
})
export class GlobalStorage {
  version = '1.0.4.0';

  user = {
    info: new PromiseValue<User>(),
    group: new PromiseValue<UserGroup>(),
    channels: new PromiseValue<IdAndName[]>(),
  };

  constructor(
    private config: ConfigRequestService,
    private local: LocalStorage,
    security: SecurityRequestService,
    region: RegionRequestService,
  ) {
    this.service = { security, region };
  }

  private service: {
    security: SecurityRequestService;
    region: RegionRequestService;
  };

  private loading?: Promise<void>;

  /**	加载当前登录用户、权限组和可查看的视频通道，重复调用只请求一次 */
  load(): Promise<void> {
    if (this.user.group.existed && this.user.channels.existed) {
      return Promise.resolve();
    }
    if (this.loading) {
      return this.loading;
    }
    let auth = this.local.auth.get();
    this.loading = this.service.security.user
      .get(auth.username)
      .then((user) => {
        this.user.info.set(user);
        /*	权限组和视频通道都只需要用户组 Id，并发请求少等一个往返
            （串行要先等权限组回来拿到 Id 才能取通道）；
            通道失败不能连累权限组，channels.load 自己兜底，不向外抛错 */
        return Promise.all([
          this.service.security.user.group.get(user.GroupId),
          this.channels.load(user.GroupId),
        ]).then(([group]) => {
          this.user.group.set(group);
        });
      })
      .finally(() => {
        this.loading = undefined;
      });
    return this.loading;
  }

  private channels = {
    /**	用户组可查看的视频通道：优先取权限组接口，失败时退回区域资源，
        两次都失败按「没有可查看通道」处理。
        必须等 channels 落地后才 resolve：元素过滤依赖它，提前 resolve 会把摄像机
        当成无权限整批隐藏，只能等下一次定时刷新（60 秒）才重新出现 */
    load: (groupId: string): Promise<void> => {
      return this.service.security.user.group.video.channel
        .array(groupId)
        .then((channels) => {
          this.user.channels.set(channels);
        })
        .catch((error) => {
          console.error('[global] 加载用户视频通道权限失败，改用区域资源', error);
          let params = new GetRegionResourcesParams();

          params.ResourceType = 1;
          return this.service.region.resource
            .all(params)
            .then((datas) => {
              let channels = datas.map((x) => {
                let channel = new IdAndName();
                channel.Id = x.ResourceId;
                channel.Name = x.ResourceName;
                return channel;
              });
              this.user.channels.set(channels);
            })
            .catch((error) => {
              console.error('[global] 加载区域资源失败，按没有可查看通道处理', error);
              this.user.channels.set([]);
            });
        });
    },
  };

  get skin(): Promise<SkinType> {
    if (location.search) {
      let params = LocationTool.query.get(location.search);
      let skin = params['skin'];
      if (skin === 'green' || skin === 'blue') {
        return Promise.resolve(skin);
      }
    }
    let cached = this.local.config.skin.get()?.skin;
    if (cached === 'green' || cached === 'blue') {
      return Promise.resolve(cached);
    }
    return this.config.get().then((cfg) => {
      let skin = cfg.skin ?? 'green';
      this.local.config.skin.set({ skin });
      return skin;
    });
  }

  set skin(value: SkinType) {
    this.local.config.skin.set({ skin: value });
  }

  destroy() {
    this.loading = undefined;
    this.user.info.clear();
    this.user.group.clear();
    /* 通道权限也要清掉，否则换账号后仍沿用上一个账号的可查看通道 */
    this.user.channels.clear();
  }
}
