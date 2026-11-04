import { AuthorizationStore } from '../authorization/authorization.store';
import { UserStorage } from '../user.storage';
import { ThreeDConfig } from './three-d-store.model';

export class ThreeDStore {
  key = 'three-d';

  private storage: UserStorage<ThreeDConfig>;

  constructor(auth: AuthorizationStore) {
    this.storage = new UserStorage<ThreeDConfig>(this.key, auth);
  }

  get() {
    return this.storage.get();
  }
  set(value: ThreeDConfig) {
    this.storage.set(value);
  }
  clear() {
    this.storage.clear();
  }
}
