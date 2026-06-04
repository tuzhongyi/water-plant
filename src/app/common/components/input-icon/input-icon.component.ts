import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'input-icon',
  imports: [CommonModule],
  templateUrl: './input-icon.component.html',
  styleUrl: './input-icon.component.less',
})
export class InputIconComponent {
  @Input() value?: string | number | null;
  @Output() valueChange = new EventEmitter<string>();
  @Input() canclear = true;
  @Input() canhover = true;
  @Output() clear = new EventEmitter<void>();

  oninput(e: Event) {
    let target = e.target as HTMLInputElement;
    this.value = target.value;
    this.valueChange.emit(this.value);
    e.stopImmediatePropagation();
  }
  onclear() {
    this.value = '';
    this.valueChange.emit(this.value);
    this.clear.emit();
  }
}
