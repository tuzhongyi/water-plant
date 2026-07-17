import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../share/header/header.component';

@Component({
  selector: 'hw-setting',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './setting.html',
  styleUrl: './setting.less',
})
export class SettingComponent {}
