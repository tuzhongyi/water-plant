import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingComponent } from './component/setting.component';
import { SettingDeviceListManagerComponent } from './setting-device/setting-device-list/setting-device-list-manager/setting-device-list-manager.component';
import { SettingDeviceSearchManagerComponent } from './setting-device/setting-device-search/setting-device-search-manager/setting-device-search-manager.component';
import { SettingIndexComponent } from './setting-index/setting-index';
import { SettingMapManagerComponent } from './setting-map/setting-map-manager/setting-map-manager.component';
import { SettingPathNode } from './setting.model';

const routes: Routes = [
  {
    path: '',
    component: SettingComponent,
    children: [
      {
        path: '',
        redirectTo: SettingPathNode.device_search,
        pathMatch: 'full',
      },
      {
        path: SettingPathNode.index,
        component: SettingIndexComponent,
      },
      {
        path: SettingPathNode.map,
        component: SettingMapManagerComponent,
      },
      {
        path: SettingPathNode.device_search,
        component: SettingDeviceSearchManagerComponent,
      },
      {
        path: SettingPathNode.device_list,
        component: SettingDeviceListManagerComponent,
      },
    ],
  },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class SettingRoutingModule {}
