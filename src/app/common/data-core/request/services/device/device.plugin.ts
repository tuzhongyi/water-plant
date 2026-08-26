import type { HowellHttpClient } from '../howell-http.client';
import type { DeviceRequestService } from './device.service';

/** 设备子服务插件：统一构造器签名 (http, device)，子服务构造时自注册到 device */
export type DevicePlugin = new (
  http: HowellHttpClient,
  device: DeviceRequestService,
) => unknown;

/** 已注册的子服务插件列表（各子服务模块加载时通过 registerDevicePlugin 加入） */
const plugins: DevicePlugin[] = [];

/** 子服务模块加载时调用，把自身加入主服务插件列表 */
export function registerDevicePlugin(plugin: DevicePlugin): void {
  plugins.push(plugin);
}

/** 主服务构造时调用，返回已注册的全部子服务 */
export function devicePlugins(): readonly DevicePlugin[] {
  return plugins;
}
