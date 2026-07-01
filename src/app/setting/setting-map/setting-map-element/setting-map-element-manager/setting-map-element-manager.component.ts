import { CommonModule } from '@angular/common';
import { Component, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ToastrService } from 'ngx-toastr';
import { HowellSelectComponent } from '../../../../common/components/hw-select/select-control.component';
import { WindowComponent } from '../../../../common/components/window-control/window.component';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../../common/data-core/models/geographic/map.model';
import { SettingMapListComponent } from '../../setting-map-list/setting-map-list.component';
import { SettingMapElementDetailsComponent } from '../setting-map-element-details/setting-map-element-details.component';
import { SettingMapElementDetailsArgs } from '../setting-map-element-details/setting-map-element-details.model';
import { SettingMapElementTableComponent } from '../setting-map-element-table/setting-map-element-table.component';
import { SettingMapElementTableArgs } from '../setting-map-element-table/setting-map-element-table.model';
import { SettingMapElementSource } from '../setting-map-element.source';
import { SettingMapElementWindow } from './setting-map-element-manager.window';

@Component({
  selector: 'hw-setting-map-element-manager',
  imports: [
    CommonModule,
    FormsModule,
    HowellSelectComponent,
    WindowComponent,
    SettingMapElementTableComponent,
    SettingMapElementDetailsComponent,
    SettingMapListComponent,
  ],
  templateUrl: './setting-map-element-manager.component.html',
  styleUrl: './setting-map-element-manager.component.less',
  providers: [SettingMapElementSource],
})
export class SettingMapElementManagerComponent {
  constructor(
    public source: SettingMapElementSource,
    private toastr: ToastrService,
  ) {}

  window = new SettingMapElementWindow(this);

  table = {
    args: new SettingMapElementTableArgs(),

    load: new EventEmitter<SettingMapElementTableArgs>(),
  };

  tree = {
    mapId: undefined as string | undefined,
    load: new EventEmitter<void>(),
    selected: undefined as GeoMap | GeoMapElement | undefined,
    on: {
      loaded: (maps: GeoMap[]) => {
        if (maps.length > 0) {
          this.tree.mapId = maps[0].Id;
        }
      },
    },
  };

  get check() {
    if (!this.tree.mapId) {
      this.toastr.warning('地图没有加载');
      return false;
    }
    if (!this.tree.selected) {
      this.toastr.warning('请选择父元素');
      return false;
    }
    return true;
  }

  manager = {
    on: {
      search: () => {
        this.table.args.first = true;
        this.table.load.emit(this.table.args);
      },
      create: () => {
        if (this.check) {
          if (this.tree.mapId && this.tree.selected) {
            let args: SettingMapElementDetailsArgs = {
              mapId: this.tree.mapId,
              parent: this.tree.selected,
              type: this.table.args.type,
            };
            this.window.details.create(args);
          }
        }
      },
    },
  };
}
