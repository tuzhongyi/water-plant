import { Injectable } from '@angular/core';
import { User } from '../data-core/models/security/user/user.model';
import { PromiseValue } from '../tools/value-tool/value.promise';

@Injectable({
  providedIn: 'root',
})
export class GlobalStorage {
  version = '0.0.0.3';

  user = new PromiseValue<User>();

  destroy() {
    this.user.clear();
  }
}
