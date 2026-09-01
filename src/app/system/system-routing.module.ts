import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SystemComponent } from './component/system.component';
import { SystemDownloadManagerComponent } from './system-download/system-download-manager/system-download-manager.component';
import { SystemMainComponent } from './system-main/system-main-manager/system-main.component';
import { SystemVideoIndexComponent } from './system-video/system-video-index/system-video-index.component';
import { SystemVideoPlaybackManagerComponent } from './system-video/system-video-playback-manager/system-video-playback-manager.component';
import { SystemVideoPreviewManagerComponent } from './system-video/system-video-preview-manager/system-video-preview-manager.component';
import { SystemPathNode, SystemVideoPathNode } from './system.model';

const routes: Routes = [
  {
    path: '',
    component: SystemComponent,
    children: [
      {
        path: '',
        redirectTo: SystemPathNode.main,
        pathMatch: 'full',
      },
      {
        path: SystemPathNode.main,
        component: SystemMainComponent,
      },
      {
        path: 'download',
        component: SystemDownloadManagerComponent,
      },
      {
        path: SystemPathNode.video,
        component: SystemVideoIndexComponent,
        children: [
          {
            path: '',
            redirectTo: SystemVideoPathNode.preview,
            pathMatch: 'full',
          },
          {
            path: SystemVideoPathNode.preview,
            component: SystemVideoPreviewManagerComponent,
          },
          {
            path: SystemVideoPathNode.playback,
            component: SystemVideoPlaybackManagerComponent,
          },
        ],
      },
    ],
  },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class SystemRoutingModule {}
