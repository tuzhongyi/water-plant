import { Routes } from '@angular/router';
import { RoutePath } from './app.path';
import { AuthorizationActivate } from './common/data-core/request/auth/authorization.activate';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: RoutePath.login,
    pathMatch: 'full',
  },
  {
    path: RoutePath.login,
    component: LoginComponent,
  },
  {
    path: RoutePath.system,
    loadChildren: () => import('./system/system.module').then((mod) => mod.SystemModule),
    canActivate: [AuthorizationActivate],
  },
  {
    path: RoutePath.setting,
    loadChildren: () => import('./setting/setting.module').then((mod) => mod.SettingModule),
    canActivate: [AuthorizationActivate],
  },
  {
    path: RoutePath.download,
    loadComponent: () =>
      import('./system/system-download/system-download-manager/system-download-manager.component').then(
        (mod) => mod.SystemDownloadManagerComponent,
      ),
    canActivate: [AuthorizationActivate],
  },
];
