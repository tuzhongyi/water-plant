import { Injectable } from '@angular/core';
import { User } from '../data-core/models/security/user/user.model';
import { ConfigRequestService } from '../data-core/request/config/config-request.service';
import { PromiseValue } from '../tools/value-tool/value.promise';
import { LocalStorage } from './local.storage';

@Injectable({
  providedIn: 'root',
})
export class GlobalStorage {
  version = '1.0.1.7';

  user = new PromiseValue<User>();

  constructor(
    private config: ConfigRequestService,
    private local: LocalStorage,
  ) {}

  get skin(): Promise<'green' | 'blue'> {
    let cached = this.local.config.skin.get();
    if (cached === 'green' || cached === 'blue') {
      return Promise.resolve(cached);
    }
    return this.config.get().then((cfg) => {
      let skin = cfg.skin ?? 'green';
      this.local.config.skin.set(skin);
      return skin;
    });
  }

  set skin(value: 'green' | 'blue') {
    this.local.config.skin.set(value);
  }

  destroy() {
    this.user.clear();
  }
}
