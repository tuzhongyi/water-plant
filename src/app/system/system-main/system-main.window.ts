import { EventEmitter } from '@angular/core';
import { PlayMode } from '../../common/components/video-player/video-player.model';
import { WindowViewModel } from '../../common/components/window-control/window.model';
import { DeviceEventRecord } from '../../common/data-core/models/events/device-event-record.model';
import { DeviceEventResource } from '../../common/data-core/models/events/device-event-resource.model';
import { EventBehaviorAction } from '../../common/data-core/models/events/event-behavior-action.model';
import { GeoMapElement } from '../../common/data-core/models/geographic/map-element.model';
import { SizeTool } from '../../common/tools/size-tool/size.tool';
import {
  PreviewArgs,
  VideoPlayerArgs,
} from '../../share/video/video-player-content/video-player-content.model';
import { ScreenMode } from '../../share/video/video-player-list/video-player-list.model';

export class SystemMainWindow {
  video = {
    single: new VideoSingleWindow(),
    multiple: new VideoMultipleWindow(),
  };
  picture = new PictureWindow();
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
class VideoMultipleWindow extends WindowViewModel {
  constructor() {
    super();
  }

  title = '';

  screen = {
    mode: ScreenMode.one,
    index: 0,
  };

  play = new EventEmitter<VideoPlayerArgs[]>();

  style = {
    ...SizeTool.window.large,
  };

  open(data: DeviceEventRecord) {
    this.title = data.Resource?.ResourceName ?? data.DeviceName ?? '';
    this.show = true;

    setTimeout(() => {
      this.from.record(data);
    }, 0);
  }

  private from = {
    record: (data: DeviceEventRecord) => {
      let args: VideoPlayerArgs[] = [];
      if (data.Actions) {
        args = data.Actions.map((x) => this.from.action(x));
      } else if (data.Resource) {
        args = this.from.resource(data.Resource);
      } else {
        let item = new PreviewArgs();
        item.cameraId = data.DeviceId ?? '';
        args = [item];
      }
      this.play.emit(args);
    },
    action: (data: EventBehaviorAction) => {
      let args = new PreviewArgs();
      args.cameraId = data.ResourceId ?? data.DeviceId ?? '';
      return args;
    },
    resource: (data: DeviceEventResource) => {
      let args = new PreviewArgs();
      args.cameraId = data.ResourceId;
      return [args];
    },
  };
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
