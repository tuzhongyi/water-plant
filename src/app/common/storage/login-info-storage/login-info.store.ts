import { LoginModel } from './login-info.model';

export class LoginInfoStore {
  key = 'login-info';
  get() {
    let str = localStorage.getItem(this.key);
    if (str) {
      let model = JSON.parse(str) as LoginModel;
      return model;
    }
    return undefined;
  }
  set(value: LoginModel) {
    localStorage.setItem(this.key, JSON.stringify(value));
  }
  clear() {
    localStorage.removeItem(this.key);
  }
  check(value: LoginModel) {
    if (!value) {
      return false;
    }
    if (!value.username) {
      return false;
    }
    if (!value.password) {
      return false;
    }
    return true;
  }
}
