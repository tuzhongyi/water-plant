import { AuthorizationStore } from '../authorization/authorization.store';
import { UserStorage } from '../user.storage';
import { ConfigDownloadStoreModel } from './config-download-storage.model';

export class ConfigDownloadStore {
  key = 'config-download';

  private storage: UserStorage<ConfigDownloadStoreModel>;

  constructor(auth: AuthorizationStore) {
    this.storage = new UserStorage<ConfigDownloadStoreModel>(this.key, auth);
  }

  get(): ConfigDownloadStoreModel {
    let model = this.storage.get();
    let max = model?.max;
    if (max === undefined || isNaN(max)) {
      max = 5;
    }
    return { max };
  }
  set(value: ConfigDownloadStoreModel) {
    this.storage.set(value);
  }
  clear() {
    this.storage.clear();
  }
}
