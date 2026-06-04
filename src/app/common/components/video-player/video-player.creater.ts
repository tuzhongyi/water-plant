import { UrlTool } from '../../tools/url-tool/url.tool';

export class VideoPlayerCreater {
  static WebUrl() {
    return UrlTool.get('/video/wsplayer/wsplayer.html');
  }
}
