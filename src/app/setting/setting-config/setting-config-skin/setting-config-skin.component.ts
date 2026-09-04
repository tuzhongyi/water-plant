import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardStatisticComponent } from '../../../common/components/card-statistic/card-statistic.component';
import { GlobalStorage } from '../../../common/storage/global.storage';

@Component({
  selector: 'hw-setting-config-skin',
  imports: [CommonModule, FormsModule, CardStatisticComponent],
  templateUrl: './setting-config-skin.component.html',
  styleUrl: './setting-config-skin.component.less',
})
export class SettingConfigSkinComponent implements OnInit {
  skin: 'green' | 'blue' = 'green';

  constructor(private global: GlobalStorage) {}

  ngOnInit(): void {
    this.global.skin.then((skin) => {
      this.skin = skin;
    });
  }

  on = {
    skin: () => {
      this.global.skin = this.skin;
      location.replace(window.location.href);
    },
  };
}
