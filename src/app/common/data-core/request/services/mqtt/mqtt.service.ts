import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UrlTool } from '../../../../tools/url-tool/url.tool';
import { wait } from '../../../../tools/wait';
import { Device } from '../../../models/devices/device.model';
import { DeviceEventRecord } from '../../../models/events/device-event-record.model';
import { MqttClient } from './mqtt.client';
import { MqttConfig } from './mqtt.model';

@Injectable({
  providedIn: 'root',
})
export class MqttRequestService {
  event = new EventEmitter<DeviceEventRecord>();

  constructor(private http: HttpClient) {}

  private loading = {
    config: false,
  };
  private _config?: MqttConfig;
  public get config(): Promise<MqttConfig> {
    if (this.loading.config) {
      return new Promise<MqttConfig>((resolve) => {
        wait(() => {
          return this.loading.config === false && !!this._config;
        }).then(() => {
          if (this._config) {
            resolve(this._config);
          }
        });
      });
    }
    if (this._config) {
      return Promise.resolve(this._config);
    }
    this.loading.config = true;
    return new Promise<MqttConfig>((resolve) => {
      let url = UrlTool.get('/assets/configs/config-mqtt.json');
      firstValueFrom(this.http.get<MqttConfig>(url)).then((x) => {
        this._config = x;
        this.loading.config = false;
        resolve(this._config);
      });
    });
  }

  async load(devices: Device[] = []) {
    let config = await this.config;
    let client = new MqttClient(config.host, config.port, config.username, config.password);
    console.log(`mqtt connect to ${config.host}:${config.port}`);

    if (devices.length == 0) {
      this.subscrib.type(client);
    } else {
      let urls: string[] = [];
      devices.forEach((x) => {
        if (config.trigger) {
          let _urls = this.subscrib.do(client, x, config.trigger.eventtypes);
          urls.push(..._urls);
        }
      });
      console.log('mqtt subscrib:', urls);
    }
  }

  private subscrib = {
    type: (client: MqttClient, type?: number) => {
      let url = `Devices/+/+/Events/${type ?? '+'}`;
      client.subscribe(
        url,
        async (data: DeviceEventRecord) => {
          this.event.emit(data);
        },
        DeviceEventRecord,
      );
      return url;
    },
    do: (client: MqttClient, device: Device, types: number[]) => {
      let urls: string[] = [];
      if (types.length == 0) {
        let url = this.subscrib.all(client, device);
        urls.push(url);
      } else {
        types.forEach((x) => {
          let url = this.subscrib.item(client, device, x);
          urls.push(url);
        });
      }
      return urls;
    },
    item: (client: MqttClient, device: Device, type: number) => {
      let url = `Devices/${device.ProtocolType}/${device.Id}/Events/${type}`;
      client.subscribe(
        url,
        async (data: DeviceEventRecord) => {
          this.event.emit(data);
        },
        DeviceEventRecord,
      );
      return url;
    },
    all: (client: MqttClient, device: Device) => {
      let url = `Devices/${device.ProtocolType}/${device.Id}/Events/+`;
      console.log(`mqtt subscribe ${url}`);
      client.subscribe(
        url,
        async (data: DeviceEventRecord) => {
          this.event.emit(data);
        },
        DeviceEventRecord,
      );
      return url;
    },
  };
}
