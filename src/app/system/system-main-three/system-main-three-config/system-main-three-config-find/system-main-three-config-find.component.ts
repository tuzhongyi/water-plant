import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardComponent } from '../../../../common/components/card/card.component';
import { WheelInputNumberDirective } from '../../../../common/directives/wheel-input-number/wheel-input-number.directive';
import { ThreeDConfig } from '../../../../common/storage/three-d-storage/three-d-store.model';

@Component({
  selector: 'hw-system-main-three-config-find',
  imports: [CommonModule, WheelInputNumberDirective, CardComponent],
  templateUrl: './system-main-three-config-find.component.html',
  styleUrl: './system-main-three-config-find.component.less',
})
export class SystemMainThreeConfigFindComponent {
  @Input() config?: ThreeDConfig;
  @Output() configChange = new EventEmitter<ThreeDConfig>();
  constructor() {}

  on = {
    change: () => {
      this.configChange.emit(this.config);
    },
  };
}
