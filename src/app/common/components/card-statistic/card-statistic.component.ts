import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'hw-card-statistic',
  imports: [],
  templateUrl: './card-statistic.component.html',
  styleUrl: './card-statistic.component.less',
  encapsulation: ViewEncapsulation.None,
})
export class CardStatisticComponent {
  @Input() type = 1;
}
