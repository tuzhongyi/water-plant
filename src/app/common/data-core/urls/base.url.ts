// export interface IUrl {
//   create(...param: string[]): string;
//   edit(...param: string[]): string;
//   del(...param: string[]): string;
//   get(...param: string[]): string;
//   list(...param: string[]): string;
// }

export class HowellUrlNode {
  static api = 'api';
  static howell = 'howell';
  static ver10 = 'ver10';
  static aiop_service = 'aiop_service';
  static data_service = 'data_service';
  static user_system = 'user_system';
  static garbage_management = 'garbage_management';
  static short_message = 'short_message';
  static sms = 'sms';
  static device_service = 'device_service';
  static ai_garbage = 'ai_garbage';
  static garbage_gateway = 'garbage_gateway';
  static tasks_service = 'tasks_service';
  static WechatIndex = 'WechatIndex';
}

export class BaseUrl {
  /** /api/howell/ver10/data_service/ */
  static get data_service() {
    return `/${HowellUrlNode.api}/${HowellUrlNode.howell}/${HowellUrlNode.ver10}/${HowellUrlNode.data_service}`;
  }

  /**  /howell/ver10/data_service/user_system/ */
  static get user_system() {
    return `/${HowellUrlNode.howell}/${HowellUrlNode.ver10}/${HowellUrlNode.data_service}/${HowellUrlNode.user_system}`;
  }
}
