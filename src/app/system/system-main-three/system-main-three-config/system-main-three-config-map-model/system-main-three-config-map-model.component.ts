import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../../common/components/card/card.component';
import { HwSwitchComponent } from '../../../../common/components/hw-switch/hw-switch.component';
import { ThreeDConfig } from '../../../../common/storage/three-d-storage/three-d-store.model';
import { SystemMainThreeSource } from '../../system-main-three.source';

@Component({
  selector: 'hw-system-main-three-config-map-model',
  imports: [CommonModule, FormsModule, HwSwitchComponent, CardComponent],
  templateUrl: './system-main-three-config-map-model.component.html',
  styleUrl: './system-main-three-config-map-model.component.less',
  providers: [SystemMainThreeSource],
})
export class SystemMainThreeConfigMapModelComponent {
  @Input() config?: ThreeDConfig;
  @Output() configChange = new EventEmitter<ThreeDConfig>();
  constructor(public source: SystemMainThreeSource) {}

  on = {
    change: () => {
      this.configChange.emit(this.config);
    },
  };
}
