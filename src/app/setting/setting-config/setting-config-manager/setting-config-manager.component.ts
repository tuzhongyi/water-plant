import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { PermissionTool } from '../../../common/tools/permission-tool/permission.tool';
import { SettingConfigDownloadComponent } from '../setting-config-download/setting-config-download.component';
import { SettingConfigMapComponent } from '../setting-config-map/setting-config-map.component';
import { SettingConfigSkinComponent } from '../setting-config-skin/setting-config-skin.component';

@Component({
  selector: 'hw-setting-config-manager',
  imports: [
    CommonModule,
    SettingConfigSkinComponent,
    SettingConfigDownloadComponent,
    SettingConfigMapComponent,
  ],
  templateUrl: './setting-config-manager.component.html',
  styleUrl: './setting-config-manager.component.less',
})
export class SettingConfigManagerComponent {
  permission = inject(PermissionTool);
}
