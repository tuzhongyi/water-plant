import { SubtitleItem } from './video-player.model';

interface SubtitleSrtItem {
  index: string;
  duration: string;
  content: string;
}
interface SubtitleSrtFirstItem extends SubtitleSrtItem {
  date: string;
}

export class VideoPlayerConverter {
  convert(content: string) {
    let datas = content.split('\r\n\r\n');

    let srts = this.srt_items(datas);

    let items = [];
    for (let i = 0; i < srts.length; i++) {
      try {
        const srt = srts[i];
        let item = this.item(srt);
        items.push(item);
      } catch (error) {
        debugger;
      }
    }

    return items;
  }

  srt_items(datas: string[]): SubtitleSrtItem[] {
    let items = [] as SubtitleSrtItem[];
    let index = 0;
    while (datas.length > 0) {
      let data = datas.shift();

      if (!data) {
        continue;
      }
      let item: SubtitleSrtItem;
      if (index == 0) {
        item = this.srt_first(data);
      } else {
        item = this.srt_item(data);
      }
      items.push(item);
      index++;
    }

    return items;
  }

  srt_item(str: string = '') {
    let datas = str.split('\r\n');
    let item: SubtitleSrtItem = {
      index: datas.shift()!,
      duration: datas.shift()!,
      content: datas.join('\r\n'),
    };
    return item;
  }
  srt_first(str: string = '') {
    let datas = str.split('\r\n');
    let item: SubtitleSrtFirstItem = {
      index: datas[0],
      duration: datas[1],
      date: datas[2],
      content: datas[3],
    };
    if (!item.content) {
      item.content = item.date;
    }

    return item;
  }

  item(srt: SubtitleSrtItem): SubtitleItem {
    let duration = this.duration(srt.duration);
    return {
      index: parseInt(srt.index),
      begin: duration.begin,
      end: duration.end,
      text: srt.content,
    };
  }

  duration(value: string) {
    let datas = value.split('-->');
    let begin = this.time(datas[0].trim());
    let end = this.time(datas[1].trim());
    return {
      begin: begin,
      end: end,
    };
  }
  time(value: string) {
    let datas = value.split(',');
    let time = datas[0]
      .trim()
      .split(':')
      .map((x) => parseInt(x));
    let date = new Date(0);
    date.setHours(
      time[0] - date.getTimezoneOffset() / 60,
      time[1],
      time[2],
      parseInt(datas[1].trim())
    );

    return date.getTime();
  }
}
