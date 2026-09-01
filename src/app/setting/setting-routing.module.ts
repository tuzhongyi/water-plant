import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SystemVideoDeviceRegionConfigComponent } from '../system/system-video/system-video-device/system-video-device-region-config/system-video-device-region-config.component';
import { SettingComponent } from './component/setting.component';
import { SettingConfigManagerComponent } from './setting-config/setting-config-manager/setting-config-manager.component';
import { SettingMapElementManagerComponent } from './setting-map/setting-map-element/setting-map-element-manager/setting-map-element-manager.component';
import { SettingMapManagerComponent } from './setting-map/setting-map-manager/setting-map-manager.component';
import { SettingPathNode } from './setting.model';

const routes: Routes = [
  {
    path: '',
    component: SettingComponent,
    children: [
      {
        path: '',
        redirectTo: SettingPathNode.map,
        pathMatch: 'full',
      },
      {
        path: SettingPathNode.map,
        component: SettingMapManagerComponent,
      },
      {
        path: SettingPathNode.map_element,
        component: SettingMapElementManagerComponent,
      },
      {
        path: SettingPathNode.config,
        component: SettingConfigManagerComponent,
      },
      {
        path: SettingPathNode.region,
        component: SystemVideoDeviceRegionConfigComponent,
      },
    ],
  },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class SettingRoutingModule {}
