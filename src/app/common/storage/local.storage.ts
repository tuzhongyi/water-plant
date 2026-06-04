import { Injectable } from '@angular/core';
import { AuthorizationStore } from './authorization/authorization.store';
import { LoginInfoStore } from './login-info-storage/login-info.store';

@Injectable({
  providedIn: 'root',
})
export class LocalStorage {
  auth = new AuthorizationStore();
  login = new LoginInfoStore();

  clear() {}
  clean() {
    this.clear();
    this.auth.clear();
    this.login.clear();
  }
}
