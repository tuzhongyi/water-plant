import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SystemComponent } from './component/system.component';
import { SystemDownloadManagerComponent } from './system-download/system-download-manager/system-download-manager.component';
import { SystemMainComponent } from './system-main/system-main-manager/system-main.component';

const routes: Routes = [
  {
    path: '',
    component: SystemComponent,
    children: [
      {
        path: '',
        redirectTo: 'main',
        pathMatch: 'full',
      },
      {
        path: 'main',
        component: SystemMainComponent,
      },
      {
        path: 'download',
        component: SystemDownloadManagerComponent,
      },
    ],
  },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class SystemRoutingModule {}
