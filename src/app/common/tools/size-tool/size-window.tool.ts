import { HtmlTool } from '../html-tool/html.tool';

export class SizeWindowTool {
  max = {
    width: 'calc(100% - 10px)',
    height: 'calc(100% - 10px)',
  };

  full = {
    width: '100%',
    height: '100%',
  };
  body = {
    border: 'none',
    top: '108px',
    transform: 'none',
    left: 0,
    'box-shadow': 'none',
    display: 'none',
  };

  large = {
    width: HtmlTool.screen.has.head.from.height(
      screen.availHeight * 0.75,
      16 / 9,
      // head + gap + button + border * 2
      52 * 2 + 40,
      // (left|right + border) * 2
      52 * 2,
    ),
    height: `${screen.availHeight * 0.75}px`,
  };

  middle = {
    width: '56%',
    height: '80%',
  };
  simple = {
    width: '500px',
    height: 'auto',
  };

  video = {
    path: {
      width: `${screen.availWidth * 0.85}px`,
      height: HtmlTool.screen.has.head.from.width(screen.availWidth * 0.85, 16 / 9, -200),
    },
  };
}
