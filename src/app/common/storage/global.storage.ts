import { Injectable } from '@angular/core';
import { UserGroup } from '../data-core/models/security/user/user-group.model';
import { User } from '../data-core/models/security/user/user.model';
import { ConfigRequestService } from '../data-core/request/config/config-request.service';
import { SkinType } from './config-skin-storage/config-skin-storage.model';
import { SecurityRequestService } from '../data-core/request/services/security/security.service';
import { LocationTool } from '../tools/location.tool';
import { PromiseValue } from '../tools/value-tool/value.promise';
import { LocalStorage } from './local.storage';

@Injectable({
  providedIn: 'root',
})
export class GlobalStorage {
  version = '1.0.3.0';

  user = {
    info: new PromiseValue<User>(),
    group: new PromiseValue<UserGroup>(),
  };

  constructor(
    private config: ConfigRequestService,
    private local: LocalStorage,
    private service: SecurityRequestService,
  ) {}

  private loading?: Promise<void>;

  /**	加载当前登录用户及其权限组，重复调用只请求一次 */
  load(): Promise<void> {
    if (this.user.group.existed) {
      return Promise.resolve();
    }
    if (this.loading) {
      return this.loading;
    }
    let auth = this.local.auth.get();
    this.loading = this.service.user
      .get(auth.username)
      .then((user) => {
        this.user.info.set(user);
        return this.service.user.group.get(user.GroupId);
      })
      .then((group) => {
        this.user.group.set(group);
      })
      .finally(() => {
        this.loading = undefined;
      });
    return this.loading;
  }

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
  }
}
