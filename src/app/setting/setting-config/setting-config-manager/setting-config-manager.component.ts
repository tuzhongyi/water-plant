import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SettingConfigDownloadComponent } from '../setting-config-download/setting-config-download.component';
import { SettingConfigSkinComponent } from '../setting-config-skin/setting-config-skin.component';

@Component({
  selector: 'hw-setting-config-manager',
  imports: [CommonModule, SettingConfigSkinComponent, SettingConfigDownloadComponent],
  templateUrl: './setting-config-manager.component.html',
  styleUrl: './setting-config-manager.component.less',
})
export class SettingConfigManagerComponent {}
