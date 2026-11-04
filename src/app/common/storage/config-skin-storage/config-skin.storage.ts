import { AuthorizationStore } from '../authorization/authorization.store';
import { UserStorage } from '../user.storage';
import { ConfigSkinStoreModel } from './config-skin-storage.model';

export class ConfigSkinStore {
  key = 'config-skin';

  private storage: UserStorage<ConfigSkinStoreModel>;

  constructor(auth: AuthorizationStore) {
    this.storage = new UserStorage<ConfigSkinStoreModel>(this.key, auth);
  }

  get() {
    return this.storage.get();
  }
  set(value: ConfigSkinStoreModel) {
    this.storage.set(value);
  }
  clear() {
    this.storage.clear();
  }
}
