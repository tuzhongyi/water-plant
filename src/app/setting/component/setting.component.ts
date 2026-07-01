import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CardComponent } from '../../common/components/card/card.component';
import { HeaderComponent } from '../../share/header/header.component';
import { SettingIndexComponent } from '../setting-index/setting-index';

@Component({
  selector: 'hw-setting',
  imports: [RouterOutlet, HeaderComponent, CardComponent, SettingIndexComponent],
  templateUrl: './setting.html',
  styleUrl: './setting.less',
})
export class SettingComponent {}
