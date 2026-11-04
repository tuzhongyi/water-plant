import { Injectable } from '@angular/core';

import { Router } from '@angular/router';
import { RoutePath } from '../app.path';
import { AuthorizationService } from '../common/data-core/request/auth/authorization.service';
import { HowellSM4 } from '../common/data-core/request/auth/howell-sm4';
import { ConfigRequestService } from '../common/data-core/request/config/config-request.service';
import { GlobalStorage } from '../common/storage/global.storage';
import { LocalStorage } from '../common/storage/local.storage';

@Injectable()
export class LoginBusiness {
  constructor(
    private service: AuthorizationService,
    private router: Router,
    private local: LocalStorage,
    private global: GlobalStorage,
    private config: ConfigRequestService,
  ) {}

  get title() {
    return this.config.get().then((x) => {
      return x.title;
    });
  }

  init() {
    this.global.destroy();
    let model = this.load();
    if (model && model.save) {
      return;
    }
    this.local.clean();
  }

  login(username: string, password: string) {
    let code = HowellSM4.encrypt(password);
    return this.service.login(username, code).then(async (x) => {
      /*	皮肤按用户缓存，切换账号后要重新应用当前用户的皮肤 */
      await this.applySkin();
      this.router.navigateByUrl(`${RoutePath.system}`);
    });
  }

  private async applySkin() {
    try {
      let skin = await this.global.skin;
      document.documentElement.setAttribute('data-skin', skin);
    } catch {
      /*	获取失败时保持当前皮肤 */
    }
  }
  remember(username: string, password: string) {
    let info = { username, password, save: true };
    info.password = HowellSM4.encrypt(password);
    this.local.login.set(info);
  }
  forget() {
    this.local.login.clear();
  }

  load() {
    let info = this.local.login.get();
    if (!info) {
      return undefined;
    }
    info.password = HowellSM4.decrypt(info.password);
    return info;
  }
}
