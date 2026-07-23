import { EventEmitter } from '@angular/core';
import { PlayMode } from '../../common/components/video-player/video-player.model';
import { WindowViewModel } from '../../common/components/window-control/window.model';
import { MapElementType } from '../../common/data-core/enums/geo/map-element-type.enum';
import { DeviceEventRecord } from '../../common/data-core/models/events/device-event-record.model';
import { DeviceEventResource } from '../../common/data-core/models/events/device-event-resource.model';
import { EventBehaviorAction } from '../../common/data-core/models/events/event-behavior-action.model';
import { GeoMapElement } from '../../common/data-core/models/geographic/map-element.model';
import { SizeTool } from '../../common/tools/size-tool/size.tool';
import {
  IVideoPlayerArgs,
  PlaybackArgs,
  PreviewArgs,
} from '../../share/video/video-player-content/video-player-content.model';
import { ScreenMode } from '../../share/video/video-player-list/video-player-list.model';

export class SystemMainWindow {
  video = {
    single: new VideoSingleWindow(),
    multiple: new VideoMultipleWindow(),
  };
  table = {
    element: new MapElementTableWindow(),
    record: new RecordTableWindow(),
  };
  config = {
    three: new ConfigThreeWiondow(),
  };
  alarm = new AlarmWindow();
}

class ConfigThreeWiondow extends WindowViewModel {
  title: string = '设置';
  style = {
    ...SizeTool.window.simple,
  };
}
class VideoSingleWindow extends WindowViewModel {
  constructor() {
    super();
  }

  cameraId?: string;
  mode: PlayMode = PlayMode.live;

  title: string = '';

  autoplay: boolean = false;
  begin?: Date;
  end?: Date;
  subtitle = false;
  style = {
    ...SizeTool.window.large,
  };

  open(data: GeoMapElement | DeviceEventRecord) {}
}

export class PictureWindow extends WindowViewModel {
  constructor() {
    super();
  }

  url: string = '';
  isError: boolean = false;
  title: string = '';
  style = {
    ...SizeTool.window.large,
  };

  // open(args: PictureArgs) {
  //   this.title = args.title;
  //   let result = await Medium.img(args.id);
  //   this.url = result.url;
  //   this.isError = result.error;

  //   this.show = true;
  // }
}
export class MapElementTableWindow extends WindowViewModel {
  title: string = '地图点位信息列表';
  type?: MapElementType;
  buildingId?: string;
  style = {
    ...SizeTool.window.large,
  };
}
export class RecordTableWindow extends WindowViewModel {
  constructor() {
    super();
  }

  title: string = '报警记录';
  style = {
    ...SizeTool.window.large,

    width: '80%',
  };
}
class VideoMultipleWindow extends WindowViewModel {
  constructor() {
    super();
  }

  title = '';

  screen = {
    mode: ScreenMode.one,
    index: 0,
  };

  play = new EventEmitter<IVideoPlayerArgs[]>();

  style = {
    ...SizeTool.window.large,
  };

  open(data: DeviceEventRecord | GeoMapElement[], alarm = false) {
    if (data instanceof DeviceEventRecord) {
      this.show = this.from.record(data, alarm);
    } else {
      this.show = this.from.map.element(data);
    }
  }

  private from = {
    map: {
      element: (datas: GeoMapElement[]) => {
        let names = datas.map((x) => x.Name);
        this.title = names.join(' | ');
        let args = datas.map((x) => this.from.map.item(x));
        setTimeout(() => {
          this.play.emit(args);
        }, 0);
        return true;
      },
      item: (data: GeoMapElement) => {
        let args = new PreviewArgs();
        args.cameraId = data.ElementId ?? '';
        return args;
      },
    },
    record: (data: DeviceEventRecord, alarm = false) => {
      this.title = data.Resource?.ResourceName ?? data.DeviceName ?? '';

      let args: IVideoPlayerArgs[] = [];
      let show = false;
      if (data.Actions && data.Actions.length > 0) {
        args = data.Actions.map((x) => this.from.action(x, alarm ? undefined : data.EventTime));
        show = true;
      } else if (data.Resource) {
        args = this.from.resource(data.Resource, alarm ? undefined : data.EventTime);
        show = data.Resource.ResourceType == 1;
      } else {
        let item = new PreviewArgs();
        item.cameraId = data.DeviceId ?? '';
        args = [item];
        return false;
      }

      setTimeout(() => {
        this.play.emit(args);
      }, 0);
      return show;
    },
    action: (data: EventBehaviorAction, time?: Date) => {
      let args: IVideoPlayerArgs;
      if (time) {
        let playback = new PlaybackArgs();
        playback.cameraId = data.ResourceId ?? data.DeviceId ?? '';
        playback.time = time;
        args = playback;
      } else {
        args = new PreviewArgs();
        args.cameraId = data.ResourceId ?? data.DeviceId ?? '';
      }

      return args;
    },
    resource: (data: DeviceEventResource, time?: Date) => {
      let args: IVideoPlayerArgs;
      if (time) {
        let playback = new PlaybackArgs();
        playback.cameraId = data.ResourceId;
        playback.time = time;
        args = playback;
      } else {
        args = new PreviewArgs();
        args.cameraId = data.ResourceId;
      }

      return [args];
    },
  };
}

class AlarmWindow extends VideoMultipleWindow {
  override style = {
    width: '65%',
    height: 'calc(65%)',
  };
}
