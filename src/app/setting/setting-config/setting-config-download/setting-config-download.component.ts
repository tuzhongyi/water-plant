import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardStatisticComponent } from '../../../common/components/card-statistic/card-statistic.component';
import { WheelInputNumberDirective } from '../../../common/directives/wheel-input-number/wheel-input-number.directive';
import { LocalStorage } from '../../../common/storage/local.storage';

@Component({
  selector: 'hw-setting-config-download',
  imports: [CommonModule, FormsModule, WheelInputNumberDirective, CardStatisticComponent],
  templateUrl: './setting-config-download.component.html',
  styleUrl: './setting-config-download.component.less',
})
export class SettingConfigDownloadComponent {
  constructor(private local: LocalStorage) {
    this.value = local.config.download.get();
  }

  value = 5;

  on = {
    change: () => {
      this.local.config.download.set(this.value);
    },
  };
}
