import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfigRequestService } from '../../common/data-core/request/config/config-request.service';
import { HeaderComponent } from '../../share/header/header.component';

@Component({
  selector: 'hw-setting',
  imports: [RouterOutlet, CommonModule, HeaderComponent],
  templateUrl: './setting.html',
  styleUrl: './setting.less',
})
export class SettingComponent {
  constructor(private config: ConfigRequestService) {
    this.config.get().then((x) => {
      this.title = x.title;
    });
  }

  title = '';
}
