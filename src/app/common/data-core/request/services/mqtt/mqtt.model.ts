export class MqttConfig {
  host!: string;
  port!: number;
  username?: string;
  password?: string;
  trigger?: MqttConfigTrigger;
}

class MqttConfigTrigger {
  duration = 10;
  eventtypes: number[] = [];
}
