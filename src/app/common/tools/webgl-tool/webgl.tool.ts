import * as THREE from 'three';

export class WebGLTool {
  /**	只提示一次，避免页面里多处调用时重复打印 */
  private static warned = false;
  /**	检测结果缓存：检测会真实创建一个 Renderer，不必每次都做 */
  private static checked: boolean | undefined;

  /**	当前浏览器是否能创建 WebGL 上下文 */
  static available(): boolean {
    if (WebGLTool.checked !== undefined) {
      return WebGLTool.checked;
    }
    WebGLTool.checked = WebGLTool.check();
    return WebGLTool.checked;
  }

  private static check(): boolean {
    /*	直接用 Three 的 Renderer 检测：简单 getContext 能成功，
        不代表 Renderer 一定能创建，浏览器策略、GPU 黑名单、
        上下文属性限制都可能在 Renderer 阶段失败 */
    try {
      return WebGLTool.renderer();
    } catch (error) {
      return WebGLTool.unavailable(error);
    }
  }

  /**	用 Three 的 Renderer 做一次真实检测（Three 就是三维组件使用的渲染器） */
  private static renderer(): boolean {
    /* 企业策略禁用 WebGL 时 Three 会向控制台打错误，这里只是探测，先静音 */
    const error = console.error;
    const warn = console.warn;
    console.error = () => {};
    console.warn = () => {};
    let reason: unknown;
    let success = false;
    try {
      const renderer = new THREE.WebGLRenderer({ antialias: false });
      renderer.dispose();
      renderer.forceContextLoss();
      success = true;
    } catch (e) {
      reason = e;
    } finally {
      console.error = error;
      console.warn = warn;
    }
    return success ? true : WebGLTool.unavailable(reason);
  }

  private static unavailable(reason: unknown): false {
    if (!WebGLTool.warned) {
      WebGLTool.warned = true;
      console.warn(
        '[webgl] 当前浏览器无法使用 WebGL，三维地图无法显示。' +
          '请在浏览器设置中开启「使用硬件加速」并重启浏览器；' +
          '如果电脑由公司统一管理，请联系管理员开启 WebGL。',
        reason,
      );
    }
    return false;
  }
}
