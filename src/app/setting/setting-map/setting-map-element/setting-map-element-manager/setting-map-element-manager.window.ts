import { WindowViewModel } from '../../../../common/components/window-control/window.model';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { SizeTool } from '../../../../common/tools/size-tool/size.tool';
import { SettingMapElementDetailsArgs } from '../setting-map-element-details/setting-map-element-details.model';
import { SettingMapElementManagerComponent } from './setting-map-element-manager.component';

export class SettingMapElementWindow {
  details: DetailsWindow;
  constructor(that: SettingMapElementManagerComponent) {
    this.details = new DetailsWindow(that);
  }
}
class DetailsWindow extends WindowViewModel {
  constructor(private that: SettingMapElementManagerComponent) {
    super();
  }
  title = '地图元素信息';

  style = {
    ...SizeTool.window.simple,
  };

  data?: GeoMapElement;
  args?: SettingMapElementDetailsArgs;

  create(args: SettingMapElementDetailsArgs) {
    this.args = args;
    this.show = true;
  }
  update(data: GeoMapElement) {
    this.data = data;
    this.show = true;
  }
  close() {
    this.args = undefined;
    this.data = undefined;
    this.show = false;
  }
  ok() {
    this.that.tree.load.emit();
    this.that.table.args.first = false;
    this.that.table.load.emit(this.that.table.args);
    this.close();
  }
}
