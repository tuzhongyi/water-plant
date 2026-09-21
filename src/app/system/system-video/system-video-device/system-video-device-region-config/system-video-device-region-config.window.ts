import { WindowViewModel } from '../../../../common/components/window-control/window.model';
import { RegionTreeNode } from '../../../../common/data-core/models/regions/region-tree-node.model';

export class SystemVideoDeviceRegionConfigWindow {
  /** 删除结点确认框 */
  delete = new DeleteAlertWindow();
  /** 同步摄像机名称确认框 */
  syncname = new SyncNameAlertWindow();
}

class DeleteAlertWindow extends WindowViewModel {
  data?: RegionTreeNode;
  style = {
    marginTop: '-25vw',
    marginLeft: '-100vh',
    top: '50%',
    left: '50%',
    width: '100vw',
    height: '100vh',
  };

  get content() {
    return `是否删除 ${this.data?.Name}？`;
  }
}

class SyncNameAlertWindow extends WindowViewModel {
  style = {
    marginTop: '-25vw',
    marginLeft: '-100vh',
    top: '50%',
    left: '50%',
    width: '100vw',
    height: '100vh',
  };
  content = '是否将区域资源名称同步为对应摄像机的通道名称？';
}
