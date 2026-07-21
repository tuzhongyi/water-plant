import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'hw-system-main-three-config-find-slider',
  imports: [CommonModule],
  templateUrl: './system-main-three-config-find-slider.component.html',
  styleUrl: './system-main-three-config-find-slider.component.less',
})
export class SystemMainThreeConfigFindSliderComponent {
  @Input() value = 0;
  @Input() min = 1;
  @Input() max = 100;
  @Input() unit = 'm';
  @Output() valueChange = new EventEmitter<number>();

  on = {
    input: (e: Event) => {
      const input = e.target as HTMLInputElement;
      this.value = parseFloat(input.value);
      this.valueChange.emit(this.value);
    },
  };
}
