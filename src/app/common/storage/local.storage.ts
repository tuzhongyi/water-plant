import { Injectable } from '@angular/core';
import { AuthorizationStore } from './authorization/authorization.store';
import { ConfigDownloadStore } from './config-download-storage/config-download.storage';
import { ConfigSkinStore } from './config-skin-storage/config-skin.storage';
import { LoginInfoStore } from './login-info-storage/login-info.store';
import { ThreeDStore } from './three-d-storage/three-d.store';

@Injectable({
  providedIn: 'root',
})
export class LocalStorage {
  auth = new AuthorizationStore();
  login = new LoginInfoStore();
  three_d = new ThreeDStore();
  config = {
    skin: new ConfigSkinStore(),
    download: new ConfigDownloadStore(),
  };

  clear() {
    this.three_d.clear();
  }
  clean() {
    this.clear();
    this.auth.clear();
    this.login.clear();
  }
}
