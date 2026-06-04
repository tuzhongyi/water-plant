import { PlayMode } from '../../common/components/video-player/video-player.model';
import { WindowViewModel } from '../../common/components/window-control/window.model';

export class SystemMainWindow {
  video = new VideoWindow();
}
class VideoWindow extends WindowViewModel {
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
    width: '80%',
    height: 'calc(80% + 40px)',
  };
}
