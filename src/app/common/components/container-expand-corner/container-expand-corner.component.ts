import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'ias-container-expand-corner',
  imports: [CommonModule],
  templateUrl: './container-expand-corner.component.html',
  styleUrl: './container-expand-corner.component.less',
})
export class ContainerExpandCornerComponent {
  @Input() icon = '';
  @Input() top = true;
  @Input() left = false;
}
