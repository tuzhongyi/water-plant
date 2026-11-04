import { WindowViewModel } from '../../../common/components/window-control/window.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { SizeTool } from '../../../common/tools/size-tool/size.tool';

export class SettingMapManagerWindow {
  details = {
    map: new MapDeltailsWindow(),
  };
  confirm = new ConfirmWindow();
}
class MapDeltailsWindow extends WindowViewModel {
  style = {
    ...SizeTool.window.simple,
    height: '380px',
  };

  title = '地图信息';
  data?: GeoMap;
}
class ConfirmWindow extends WindowViewModel {
  data?: GeoMapElement;
  /** 确认动作：解绑，或设备已不存在时删除点位 */
  mode: 'unbind' | 'stale' = 'unbind';
  get content() {
    if (this.mode == 'stale') {
      return `设备已不存在，是否删除点位 ${this.data?.Name}？`;
    }
    return `是否解除 ${this.data?.Name} 的绑定？`;
  }
}
