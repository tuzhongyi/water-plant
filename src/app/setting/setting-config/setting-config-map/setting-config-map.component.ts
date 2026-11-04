import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardStatisticComponent } from '../../../common/components/card-statistic/card-statistic.component';
import { HwSwitchComponent } from '../../../common/components/hw-switch/hw-switch.component';
import { LocalStorage } from '../../../common/storage/local.storage';

@Component({
  selector: 'hw-setting-config-map',
  imports: [CommonModule, FormsModule, HwSwitchComponent, CardStatisticComponent],
  templateUrl: './setting-config-map.component.html',
  styleUrl: './setting-config-map.component.less',
})
export class SettingConfigMapComponent {
  constructor(private local: LocalStorage) {
    /* 未配置时默认显示绿植 */
    this.value = this.local.config.map.get().tree;
  }

  /** 是否显示绿植（场景中的树） */
  value = false;

  on = {
    change: (value: boolean) => {
      this.value = value;
      this.local.config.map.set({ tree: value });
    },
  };
}
