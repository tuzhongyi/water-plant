import { CommonModule } from '@angular/common';
import { Component, EventEmitter } from '@angular/core';
import { WindowComponent } from '../../../common/components/window-control/window.component';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { SettingMapDetailsComponent } from '../setting-map-details/setting-map-details.component';
import { SettingMapListComponent } from '../setting-map-list/setting-map-list.component';
import { SettingMapThreeComponent } from '../setting-map-three/setting-map-three.component';
import { SettingMapManagerWindow } from './setting-map-manager.window';

@Component({
  selector: 'hw-setting-map-manager',
  imports: [
    CommonModule,
    SettingMapThreeComponent,
    SettingMapListComponent,
    WindowComponent,
    SettingMapDetailsComponent,
  ],
  templateUrl: './setting-map-manager.component.html',
  styleUrl: './setting-map-manager.component.less',
})
export class SettingMapManagerComponent {
  constructor() {}

  window = new SettingMapManagerWindow();

  geo = {
    map: {
      load: new EventEmitter<void>(),
      details: {
        open: (data?: GeoMap) => {
          this.window.details.map.data = data;
          this.window.details.map.show = true;
        },
        ok: (data: GeoMap) => {
          this.geo.map.load.emit();
          this.geo.map.details.close();
        },
        close: () => {
          this.window.details.map.show = false;
        },
      },
    },
    element: {},
  };
}
