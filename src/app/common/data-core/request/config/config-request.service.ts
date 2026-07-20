import { Injectable } from '@angular/core';
import { PathTool } from '../../../tools/path-tool/path.tool';
import { Config, MapConfig } from './config.model';

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

  get map(): Promise<MapConfig> {
    let protocol = location.protocol;
    if (!protocol.includes(':')) {
      protocol += ':';
    }
    let port = '';
    if (location.port) {
      port = ':' + location.port;
    }
    let url = `${protocol}//${location.hostname}${port}${PathTool.config.map}`;
    return fetch(`${url}?t=${new Date().getTime()}`).then((res) => {
      return res.json();
    });
  }
}
