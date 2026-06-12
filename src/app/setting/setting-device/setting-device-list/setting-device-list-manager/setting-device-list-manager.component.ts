import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingDeviceListTableComponent } from '../setting-device-list-table/setting-device-list-table.component';

@Component({
  selector: 'hw-setting-device-list-manager',
  imports: [CommonModule, FormsModule, SettingDeviceListTableComponent],
  templateUrl: './setting-device-list-manager.component.html',
  styleUrl: './setting-device-list-manager.component.less',
})
export class SettingDeviceListManagerComponent {}
