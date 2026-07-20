import { Injectable } from '@angular/core';
import { AuthorizationStore } from './authorization/authorization.store';
import { LoginInfoStore } from './login-info-storage/login-info.store';
import { ThreeDStore } from './three-d-storage/three-d.store';

@Injectable({
  providedIn: 'root',
})
export class LocalStorage {
  auth = new AuthorizationStore();
  login = new LoginInfoStore();
  three_d = new ThreeDStore();

  clear() {
    this.three_d.clear();
  }
  clean() {
    this.clear();
    this.auth.clear();
    this.login.clear();
  }
}
