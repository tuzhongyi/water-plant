import { CommonModule } from '@angular/common';
import { Component, EventEmitter, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CardComponent } from '../../../common/components/card/card.component';
import { WindowComponent } from '../../../common/components/window-control/window.component';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { IIdNameModel } from '../../../common/data-core/models/interface/model.interface';
import { SettingDeviceTreeComponent } from '../../setting-device/setting-device-tree/setting-device-tree.component';
import { SettingMapBusiness } from '../business/setting-map.business';
import { BindingArgs } from '../business/setting-map.model';
import { SettingMapDetailsComponent } from '../setting-map-details/setting-map-details.component';
import { SettingMapThreeComponent } from '../setting-map-three/setting-map-three.component';
import { SettingMapManagerWindow } from './setting-map-manager.window';

@Component({
  selector: 'hw-setting-map-manager',
  imports: [
    CommonModule,
    SettingMapThreeComponent,
    SettingDeviceTreeComponent,
    WindowComponent,
    CardComponent,
    SettingMapDetailsComponent,
  ],
  templateUrl: './setting-map-manager.component.html',
  styleUrl: './setting-map-manager.component.less',
  providers: [SettingMapBusiness],
})
export class SettingMapManagerComponent {
  constructor(
    private business: SettingMapBusiness,
    private toastr: ToastrService,
  ) {}

  window = new SettingMapManagerWindow();

  manager = {
    load: new EventEmitter<void>(),
  };

  geo = {
    map: {
      data: signal<GeoMap | undefined>(undefined),

      details: {
        open: (data?: GeoMap) => {
          this.window.details.map.data = data;
          this.window.details.map.show = true;
        },
        ok: (data: GeoMap) => {
          this.manager.load.emit();
          this.geo.map.details.close();
        },
        close: () => {
          this.window.details.map.show = false;
        },
      },
    },
    element: {
      datas: signal<GeoMapElement[]>([]),
    },
  };

  three = {
    standby: signal<IIdNameModel | undefined>(undefined),
    selected: signal<IIdNameModel | undefined>(undefined),
    on: {
      loaded: {
        map: (data: GeoMap) => {
          this.geo.map.data.set(data);
        },
        building: (datas: GeoMapElement[]) => {
          let elements = [...datas, ...this.geo.element.datas()];
          this.geo.element.datas.set(elements);
        },
        camera: (datas: GeoMapElement[]) => {
          this.geo.element.datas.set(datas);
        },
      },
      bind: (args: BindingArgs) => {
        let standby = this.three.standby();
        if (standby?.Id != args.standby.Id) return;

        let mapId = args.parent?.Id;
        if (!mapId) {
          let map = this.geo.map.data();
          if (!map) {
            this.toastr.warning('地图加载失败');
            return;
          }
          mapId = map.Id;
        }

        if (standby instanceof VideoChannel) {
          this.business.element
            .bind(standby, args.location, mapId, args.modelId, args.parent?.Id)
            .then(() => {
              this.toastr.success('摄像机添加成功');
              this.three.standby.set(undefined);
              this.manager.load.emit();
            });
        }
      },
    },
  };

  tree = {
    standby: (data: IIdNameModel) => {
      this.three.standby.set(data);
    },
    position: (data: VideoChannel) => {
      let element = this.geo.element.datas().find((x) => x.ElementId == data.Id);
      this.three.selected.set(element);
    },
  };
}
