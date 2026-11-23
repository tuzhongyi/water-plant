export class WebGLTool {
  /**	只提示一次，避免页面里多处调用时重复打印 */
  private static warned = false;

  /**	当前浏览器是否能创建 WebGL 上下文 */
  static available(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
      if (!gl) return WebGLTool.unavailable('浏览器未返回 WebGL 上下文');
      /* 检测用的上下文立即释放，避免占用浏览器的 WebGL 上下文数量 */
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return true;
    } catch (error) {
      return WebGLTool.unavailable(error);
    }
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
