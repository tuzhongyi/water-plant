import { WindowViewModel } from '../../../common/components/window-control/window.model';
import { SizeTool } from '../../../common/tools/size-tool/size.tool';
import { SystemVideoManagerComponent } from './system-video-manager.component';

export class SystemVideoManagerWindow {
  constructor(that: SystemVideoManagerComponent) {
    this.config = new ConfigWindow(that);
  }
  config: ConfigWindow;
}

class ConfigWindow extends WindowViewModel {
  constructor(private that: SystemVideoManagerComponent) {
    super();
  }
  style = {
    ...SizeTool.window.large,
  };
  title = '区域资源配置';

  changed = false;

  on = {
    close: () => {
      if (this.changed) {
        this.that.device.reload.emit();
        this.changed = false;
      }
    },
  };
}
