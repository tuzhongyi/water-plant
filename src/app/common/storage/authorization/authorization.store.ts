import { AuthModel } from './authorization.model';

export class AuthorizationStore {
  constructor() {}

  key = 'authorization';
  get() {
    let str = localStorage.getItem(this.key);
    let model = JSON.parse(str || '{}') as AuthModel;
    return model;
  }
  set(value: AuthModel) {
    localStorage.setItem(this.key, JSON.stringify(value));
  }
  clear() {
    localStorage.removeItem(this.key);
  }
  check(value: AuthModel) {
    if (!value) {
      return false;
    }
    if (!value.username) {
      return false;
    }
    if (!value.token) {
      return false;
    }
    return true;
  }
}
