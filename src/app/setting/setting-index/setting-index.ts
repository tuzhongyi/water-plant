import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Observable } from 'rxjs';
import { CardComponent } from '../../common/components/card/card.component';
import { PermissionTool } from '../../common/tools/permission-tool/permission.tool';
import { SettingPath } from '../setting.model';

@Component({
  selector: 'hw-setting-index',
  imports: [CommonModule, CardComponent],
  templateUrl: './setting-index.html',
  styleUrl: './setting-index.less',
})
export class SettingIndexComponent {
  constructor(private router: Router) {}

  permission = inject(PermissionTool);
  SettingPath = SettingPath;

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
      this.redirect();
    });
  }

  /**	非根用户不能停留在只有根用户可见的页面上 */
  private redirect() {
    if (!this.permission.loaded) {
      return;
    }
    if (this.permission.isRoot) {
      return;
    }
    let forbidden = [SettingPath.map, SettingPath.map_element, SettingPath.region];
    if (forbidden.includes(this.path as SettingPath)) {
      this.router.navigateByUrl(`/${SettingPath.config}`);
    }
  }

  /**	权限加载完成后校验一次当前页 */
  private check() {
    this.permission
      .load()
      .then(() => {
        this.redirect();
      })
      .catch(() => {});
  }

  on = {
    path: (path: SettingPath) => {
      this.router.navigateByUrl(`/${path}`);
    },
  };
}
