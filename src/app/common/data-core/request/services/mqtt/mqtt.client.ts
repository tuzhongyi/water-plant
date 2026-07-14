import { ClassConstructor, plainToInstance } from 'class-transformer';
import { IMqttMessage, IMqttServiceOptions, MqttService as Service } from 'ngx-mqtt';
import { Subscription } from 'rxjs';

export class MqttClient {
  private subscription?: Subscription;
  private options: IMqttServiceOptions;
  private service: Service;

  constructor(host: string, port: number, username?: string, password?: string) {
    if (host === 'localhost' || host === '127.0.0.1') {
      host = window.location.hostname;
    }
    if (location.port === '9001') {
      host = '192.168.21.122';
    }
    this.options = {
      hostname: host,
      port: port,
      protocol: location.protocol.includes('https') ? 'wss' : 'ws',
      username: username,
      password: password,
    };
    this.service = new Service(this.options);
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
