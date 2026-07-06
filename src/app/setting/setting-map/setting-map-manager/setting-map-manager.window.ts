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
  get content() {
    return `是否解除 ${this.data?.Name} 的绑定？`;
  }
}
