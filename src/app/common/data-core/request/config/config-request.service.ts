import { Injectable } from '@angular/core';
import { PathTool } from '../../../tools/path-tool/path.tool';
import { Config } from './config.model';
import { MapConfig } from './map/config-map.model';

@Injectable({
  providedIn: 'root',
})
export class ConfigRequestService {
  constructor() {}

  get version() {
    return fetch(`${PathTool.config.version}?t=${new Date().getTime()}`).then((res) =>
      res.json().then((data) => data.version),
    );
  }

  get(): Promise<Config> {
    let protocol = location.protocol;
    if (!protocol.includes(':')) {
      protocol += ':';
    }
    let port = '';
    if (location.port) {
      port = ':' + location.port;
    }
    let url = `${protocol}//${location.hostname}${port}${PathTool.config.global}`;
    return fetch(`${url}?t=${new Date().getTime()}`).then((res) => {
      return res.json();
    });
  }

  /** 地图配置只请求一次：每个点位转换都会读 map，不缓存会重复请求 config-map.json */
  private _map?: Promise<MapConfig>;

  get map(): Promise<MapConfig> {
    if (!this._map) {
      let protocol = location.protocol;
      if (!protocol.includes(':')) {
        protocol += ':';
      }
      let port = '';
      if (location.port) {
        port = ':' + location.port;
      }
      let url = `${protocol}//${location.hostname}${port}${PathTool.config.map}`;
      let promise = fetch(`${url}?t=${new Date().getTime()}`).then((res) => {
        return res.json();
      });
      /* 请求失败不缓存，下次访问重新请求 */
      promise.catch(() => {
        if (this._map === promise) {
          this._map = undefined;
        }
      });
      this._map = promise;
    }
    return this._map;
  }
}
