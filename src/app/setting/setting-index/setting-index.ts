import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CardComponent } from '../../common/components/card/card.component';

@Component({
  selector: 'hw-setting-index',
  imports: [CommonModule, CardComponent],
  templateUrl: './setting-index.html',
  styleUrl: './setting-index.less',
})
export class SettingIndexComponent {}
