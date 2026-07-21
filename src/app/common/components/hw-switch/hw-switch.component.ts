import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'hw-switch',
  imports: [CommonModule],
  templateUrl: './hw-switch.component.html',
  styleUrl: './hw-switch.component.less',
})
export class HwSwitchComponent {
  /** 开关状态 */
  @Input() checked = false;
  /** 颜色名，对应 color-@.less 中的色值（green/red/blue/orange/cyan/yellow/pink/purple/sky） */
  @Input() color = 'green';
  /** 禁用 */
  @Input() disabled = false;

  @Output() checkedChange = new EventEmitter<boolean>();

  toggle() {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
  }
}
