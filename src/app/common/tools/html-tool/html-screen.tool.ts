export class HtmlScreenTool {
  ratio = {
    height: (value: number) => {
      return `${screen.height * value}px`;
    },
  };

  has = {
    head: {
      from: {
        width: (width: number, ratio: number, head: number) => {
          let height = width / ratio;
          return `${height + head}px`;
        },
        height: (hegiht: number, ratio: number, diff: number, gain: number) => {
          let width = (hegiht - diff) * ratio;
          return `${width + gain}px`;
        },
      },
    },
  };

  get = {
    fullscreen: () => {
      return !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
    },
  };

  set = {
    fullscreen(value: boolean, e?: HTMLElement) {
      if (!value) {
        const doc: any = document;
        if (doc.exitFullscreen) {
          doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
        return;
      }
      const element: any = e ?? document.body;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    },
  };
}
