# 视频播放器使用说明（独立文档）

本目录是一份可独立使用的视频播放器说明，不依赖其他说明书，可整体复制到其他项目。

| 文件 | 说明 |
| --- | --- |
| `视频播放器使用说明.html` | 网页版，浏览器直接打开 |
| `视频播放器使用说明.md` | Markdown 版 |
| `视频播放器使用说明.pdf` | A4 打印版 |
| `preview.png` | 实时预览截图（含底部控制按钮） |
| `playback.png` | 录像回放截图（含进度条、倍速等按钮） |
| `icons/` | 从播放器 `private/video` 的图标字体中提取的按钮图标，与播放器一致 |

内容：适用范围、画面信息、实时预览按钮、录像回放按钮、通用操作与提示。

重新生成 PDF：

```bat
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="Q:\Angular\water-plant\public\help\video\视频播放器使用说明.pdf" "file:///Q:/Angular/water-plant/public/help/video/视频播放器使用说明.html"
```
