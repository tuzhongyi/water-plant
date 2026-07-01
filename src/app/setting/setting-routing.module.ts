import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingComponent } from './component/setting.component';
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
    ],
  },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class SettingRoutingModule {}
