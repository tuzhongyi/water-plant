import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardStatistic1Component } from '../../../common/components/card-statistic-1/card-statistic-1.component';
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';
import { SystemMainThreeArgs } from '../business/system-main-three.model';
import { SystemMainThreeSource } from '../system-main-three.source';

@Component({
  selector: 'hw-system-main-three-filter',
  imports: [CommonModule, FormsModule, CardStatistic1Component],
  templateUrl: './system-main-three-filter.component.html',
  styleUrl: './system-main-three-filter.component.less',
  providers: [SystemMainThreeSource],
})
export class SystemMainThreeFilterComponent {
  @Input() args = new SystemMainThreeArgs();
  @Output() argsChange = new EventEmitter<SystemMainThreeArgs>();
  @Output() close = new EventEmitter<void>();

  constructor(public source: SystemMainThreeSource) {}

  on = {
    ok: () => {
      this.argsChange.emit(this.args);
    },
    close: () => {
      this.close.emit();
    },
    reset: () => {
      let args = ObjectTool.assign(this.args, SystemMainThreeArgs);
      args.name = undefined;
      args.type = undefined;
      this.args = args;
      this.argsChange.emit(this.args);
    },
  };
}
