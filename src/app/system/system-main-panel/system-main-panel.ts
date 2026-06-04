import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NameValue } from '../../common/data-core/models/capabilities/enum-name-value.model';

@Component({
  selector: 'hw-system-main-panel',
  imports: [CommonModule],
  templateUrl: './system-main-panel.html',
  styleUrl: './system-main-panel.less',
})
export class SystemMainPanel {
  @Input() title = '';
  @Input() items: NameValue<any>[] = [];
}
