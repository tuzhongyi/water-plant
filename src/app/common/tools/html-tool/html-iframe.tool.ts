export class HtmlIFrameElementTool {
  crossorigin(src: string) {
    let url = new URL(src);
    return (
      url.protocol !== location.protocol ||
      url.hostname !== location.hostname ||
      url.port !== location.port
    );
  }
}
