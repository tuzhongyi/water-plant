import { WindowViewModel } from '../../../common/components/window-control/window.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { SizeTool } from '../../../common/tools/size-tool/size.tool';

export class SettingMapManagerWindow {
  details = {
    map: new MapDeltailsWindow(),
  };
}
class MapDeltailsWindow extends WindowViewModel {
  style = {
    ...SizeTool.window.simple,
    height: '380px',
  };

  title = '地图信息';
  data?: GeoMap;
}
