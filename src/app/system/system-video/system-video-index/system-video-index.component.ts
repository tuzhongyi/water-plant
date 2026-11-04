import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Observable } from 'rxjs';
import { CardComponent } from '../../../common/components/card/card.component';
import { PermissionTool } from '../../../common/tools/permission-tool/permission.tool';
import { SystemPath } from '../../system.model';

@Component({
  selector: 'hw-system-video-index',
  imports: [CommonModule, RouterOutlet, CardComponent],
  templateUrl: './system-video-index.component.html',
  styleUrl: './system-video-index.component.less',
})
export class SystemVideoIndexComponent {
  constructor(private router: Router) {}

  permission = inject(PermissionTool);
  Path = SystemPath;

  path: string = location.pathname.substring(1);

  ngOnInit(): void {
    this.load();
    this.check();
  }

  private load() {
    (
      this.router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
      ) as Observable<NavigationEnd>
    ).subscribe((router) => {
      this.path = location.pathname.substring(1);
    });
  }

  /**	权限加载完成后校验当前页，没有权限的页不进去 */
  private check() {
    this.permission
      .load()
      .then(() => {
        let { preview, playback } = this.permission;
        if (!preview && !playback) {
          this.router.navigateByUrl(`/${SystemPath.main}`);
          return;
        }
        if (this.path == this.Path.video.preview && !preview) {
          this.router.navigateByUrl(`/${this.Path.video.playback}`);
          return;
        }
        if (this.path == this.Path.video.playback && !playback) {
          this.router.navigateByUrl(`/${this.Path.video.preview}`);
        }
      })
      .catch(() => {});
  }

  on = {
    path: (path: string) => {
      this.router.navigateByUrl(`/${path}`);
    },
  };
}
