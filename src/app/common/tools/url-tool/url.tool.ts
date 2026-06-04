import { ImageUrlTool } from './image-url.tool';

export class UrlTool {
  static get(url: string) {
    let protocol = location.protocol;
    if (!protocol.includes(':')) {
      protocol += ':';
    }
    let port = '';
    if (location.port) {
      port = ':' + location.port;
    }
    return `${protocol}//${location.hostname}${port}${url}`;
  }

  static image = ImageUrlTool;
}
