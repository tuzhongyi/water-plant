import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfigRequestService } from '../../common/data-core/request/config/config-request.service';
import { HeaderComponent } from '../../share/header/header.component';
import { SettingIndexComponent } from '../setting-index/setting-index';

@Component({
  selector: 'hw-setting',
  imports: [RouterOutlet, CommonModule, HeaderComponent, SettingIndexComponent],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.less',
})
export class SettingComponent {
  constructor(private config: ConfigRequestService) {
    this.config.get().then((x) => {
      this.title.set(x.title);
    });
  }

  title = signal<string>('');
}
