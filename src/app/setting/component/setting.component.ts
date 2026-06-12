import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../share/header/header.component';
import { SettingIndexComponent } from '../setting-index/setting-index';

@Component({
  selector: 'hw-setting',
  imports: [RouterOutlet, HeaderComponent, SettingIndexComponent],
  templateUrl: './setting.html',
  styleUrl: './setting.less',
})
export class SettingComponent {}
