import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CardComponent } from '../../../../common/components/card/card.component';
import { LocalStorage } from '../../../../common/storage/local.storage';

@Component({
  selector: 'hw-system-main-three-config-find',
  imports: [CommonModule, CardComponent],
  templateUrl: './system-main-three-config-find.component.html',
  styleUrl: './system-main-three-config-find.component.less',
})
export class SystemMainThreeConfigFindComponent {
  constructor(private local: LocalStorage) {}
}
