import { PlayMode } from '../../common/components/video-player/video-player.model';
import { WindowViewModel } from '../../common/components/window-control/window.model';
import { SizeTool } from '../../common/tools/size-tool/size.tool';

export class SystemMainWindow {
  video = {
    single: new VideoSingleWindow(),
    multiple: new VideoMultipleWindow(),
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
}
class VideoMultipleWindow extends WindowViewModel {
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
}
