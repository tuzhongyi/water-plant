import { WindowViewModel } from '../../../../common/components/window-control/window.model';
import { SizeTool } from '../../../../common/tools/size-tool/size.tool';
import { SystemVideoPreviewManagerComponent } from '../system-video-preview-manager.component';
import { SystemVideoPreviewManagerViewGroupWindow } from './system-video-preview-manager-viewgroup.window';

export class SystemVideoPreviewManagerWindow {
  constructor(that: SystemVideoPreviewManagerComponent) {
    this.config = new ConfigWindow(that);
    this.viewgroup = new SystemVideoPreviewManagerViewGroupWindow(that);
  }
  config: ConfigWindow;
  viewgroup: SystemVideoPreviewManagerViewGroupWindow;
}

class ConfigWindow extends WindowViewModel {
  constructor(private that: SystemVideoPreviewManagerComponent) {
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
class ConfirmWindow extends WindowViewModel {
  constructor(private that: SystemVideoPreviewManagerComponent) {
    super();
  }
}
