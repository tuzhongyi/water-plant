import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfigRequestService } from '../../common/data-core/request/config/config-request.service';
import { PermissionTool } from '../../common/tools/permission-tool/permission.tool';
import { HeaderComponent } from '../../share/header/header.component';
import { SettingIndexComponent } from '../setting-index/setting-index';

@Component({
  selector: 'hw-setting',
  imports: [RouterOutlet, CommonModule, HeaderComponent, SettingIndexComponent],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.less',
})
export class SettingComponent {
  private permission = inject(PermissionTool);

  constructor(private config: ConfigRequestService) {
    this.config.get().then((x) => {
      this.title.set(x.title);
    });
    /*	设置页也可能是直接打开的入口，这里加载一次用户权限 */
    this.permission.load().catch(() => {});
  }

  title = signal<string>('');
}
