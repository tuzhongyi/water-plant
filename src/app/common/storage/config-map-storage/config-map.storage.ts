import { AuthorizationStore } from '../authorization/authorization.store';
import { UserStorage } from '../user.storage';
import { ConfigMapStoreModel } from './config-map-storage.model';

export class ConfigMapStore {
  key = 'config-map';

  private storage: UserStorage<ConfigMapStoreModel>;

  constructor(auth: AuthorizationStore) {
    this.storage = new UserStorage<ConfigMapStoreModel>(this.key, auth);
  }

  get(): ConfigMapStoreModel {
    return {
      /*	未配置时默认显示绿植	*/
      tree: this.storage.get()?.tree ?? true,
    };
  }
  set(value: ConfigMapStoreModel) {
    this.storage.set(value);
  }
  clear() {
    this.storage.clear();
  }
}
