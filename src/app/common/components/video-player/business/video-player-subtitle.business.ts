import { Injectable } from '@angular/core';

@Injectable()
export class VideoPlayerSubtitleBusiness {
  // constructor(
  //   subtitling: SubtitlingRequestService,
  //   config: ConfigRequestService,
  //   sr: SRServerRequestService
  // ) {
  //   this.service = {
  //     subtitling: subtitling,
  //     config: config,
  //   };
  // }
  // service: {
  //   subtitling: SubtitlingRequestService;
  //   config: ConfigRequestService;
  // };
  // converter = new VideoPlayerConverter();
  // async load(index: number, model: VideoModel) {
  //   // let content = await this.service.config.test.subtitle();
  //   let content = await this.loadData(model);
  //   this.datas.set(index, content);
  // }
  // private loadData(model: VideoModel) {
  //   let params = new GetSubtitlingSrtParams();
  //   params.BeginTime = model.beginTime!;
  //   params.EndTime = model.endTime!;
  //   if (model.sourceId) {
  //     params.ChannelId = model.sourceId;
  //   } else {
  //     params.SRCameraId = model.deviceId;
  //   }
  //   return this.service.subtitling.srt(params);
  // }
  // close(index: number) {
  //   if (this.datas.has(index)) {
  //     this.datas.delete(index);
  //   }
  // }
  // get(index: number, postition: number) {
  //   let content = this.datas.get(index);
  //   if (content) {
  //     let items = this.converter.convert(content);
  //     let item = items.find((item) => {
  //       return item.begin <= postition && item.end > postition;
  //     });
  //     return item;
  //   }
  //   return undefined;
  //   // let _begin = formatDate(begin, 'HH:mm:ss,SSS', 'en');
  //   // let _end = formatDate(end, 'HH:mm:ss,SSS', 'en');
  //   // let time = `${_begin} --> ${_end}`;
  //   // let start_index = content.indexOf(time);
  //   // let end_index = content.indexOf('\r', start_index + time.length);
  //   // return content.substring(start_index, end_index);
  // }
  // datas = new Map<number, string>();
}
