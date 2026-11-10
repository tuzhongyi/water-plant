import { EventEmitter } from '@angular/core';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { IMqttMessage, IMqttServiceOptions, MqttService as Service } from 'ngx-mqtt';
import { Subscription } from 'rxjs';
import { ProxyTool } from '../../../../tools/proxy.tool';

export class MqttClient {
  /**	重连节奏：前 10 秒每秒重连一次，之后改成每 10 秒一次。
      连不上时浏览器每次重连都会打印一条 “WebSocket connection to ... failed”
      （浏览器自己打的，代码里拦不掉），一开始要恢复得快，长时间连不上就别刷屏了 */
  private static reconnect = {
    fast: 1000,
    slow: 10000,
    /** 连续失败多久后从 fast 切到 slow */
    duration: 10000,
  };

  /** 连接失败提醒：一次连续失败只触发一次，重连成功后重新计数 */
  onfail = new EventEmitter<void>();

  private subscription?: Subscription;
  private options: IMqttServiceOptions;
  private service: Service;
  /** 已经提示过失败：重连期间一直连不上时不再重复提示 */
  private failed = false;
  /** 从 fast 切到 slow 的定时器 */
  private timer?: ReturnType<typeof setTimeout>;
  /** 当前生效的重连间隔 */
  private period = MqttClient.reconnect.fast;

  constructor(host: string, port: number, username?: string, password?: string) {
    if (host === 'localhost' || host === '127.0.0.1') {
      host = window.location.hostname;
    }
    if (location.port === '9001') {
      /* 开发服务器：直连接口服务（proxy.conf.ts 第一项） */
      host = ProxyTool.service;
    }
    this.options = {
      hostname: host,
      port: port,
      protocol: location.protocol.includes('https') ? 'wss' : 'ws',
      username: username,
      password: password,
      reconnectPeriod: MqttClient.reconnect.fast,
      connectTimeout: 5000,
    };
    this.service = new Service(this.options);

    this.service.onConnect.subscribe(() => {
      this.failed = false;
      /* 连上后回到快速重连，下次掉线还能尽快恢复 */
      this.setPeriod(MqttClient.reconnect.fast);
    });
    this.service.onError.subscribe(() => {
      this.slowdown();
      if (this.failed) return;
      this.failed = true;
      this.onfail.emit();
    });
    this.service.onClose.subscribe(() => {
      this.slowdown();
    });
  }

  /**	连续失败超过 10 秒后把重连间隔放宽到 10 秒：
      mqtt.js 每失败一次都会用当时的 options.reconnectPeriod 重新起定时器，
      所以改这个值下一轮就生效 */
  private slowdown(): void {
    if (this.period === MqttClient.reconnect.slow || this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.setPeriod(MqttClient.reconnect.slow);
    }, MqttClient.reconnect.duration);
  }

  /** 设置重连间隔（ngx-mqtt 没有公开底层客户端，只能从 service 上取） */
  private setPeriod(period: number): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (this.period === period) return;
    this.period = period;
    const client = (
      this.service as unknown as { client?: { options?: { reconnectPeriod?: number } } }
    ).client;
    if (client?.options) {
      client.options.reconnectPeriod = period;
    }
  }

  subscribe<T>(topic: string, fn?: (message: T) => Promise<void>, cls?: ClassConstructor<T>) {
    this.subscription = this.service.observe(topic).subscribe((message: IMqttMessage) => {
      if (fn) {
        console.log('收到MQTT消息');
        let payload = JSON.parse(message.payload.toString());
        if (cls) {
          console.log('序列化：', message.payload.toString());
          let data = plainToInstance(cls, payload) as T;
          fn(data);
        } else {
          fn(payload);
        }
      }
    });
  }

  publish(topic: string, message: string) {
    this.service.unsafePublish(topic, message, { qos: 1, retain: true });
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
