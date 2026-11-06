/**
 * 开发服务器（ng serve，9001 端口）下浏览器需要直连后端时用到的转发地址。
 * 统一从 proxy.conf.ts 读取：改环境只改 proxy.conf.ts，不在多个文件里各写一份。
 * 数组第一项是接口服务，第二项是视频服务。
 *
 * proxy.conf.ts 在 src 之外，用 require 取（不进 tsconfig，不改 rootDir / include），
 * 由打包器直接把文件内容打进来。
 */
const proxy = require('../../../../proxy.conf');
const PROXY_CONFIG: { target?: string }[] = proxy.default ?? proxy;

export class ProxyTool {
  /** 接口服务地址（proxy.conf.ts 第一项） */
  static get service(): string {
    return ProxyTool.host(0);
  }

  /** 视频服务地址（proxy.conf.ts 第二项） */
  static get video(): string {
    return ProxyTool.host(1);
  }

  /** 取第 index 项 target 的主机名（端口由调用方自己决定，这里不返回端口） */
  private static host(index: number): string {
    let target = PROXY_CONFIG[index]?.target;
    if (!target) return location.hostname;
    try {
      return new URL(target).hostname;
    } catch {
      /* target 可能没写协议（如 192.168.21.122:10000）：去掉协议、端口和路径 */
      return target.replace(/^\w+:\/\//, '').split(':')[0].split('/')[0];
    }
  }
}
