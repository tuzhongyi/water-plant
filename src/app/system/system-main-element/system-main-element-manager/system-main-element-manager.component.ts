import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HowellSelectComponent } from '../../../common/components/hw-select/select-control.component';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { SystemMainElementTableComponent } from '../system-main-element-table/system-main-element-table.component';
import { SystemMainElementTableArgs } from '../system-main-element-table/system-main-element-table.model';
import { SystemMainElementSource } from '../system-main-element.source';

@Component({
  selector: 'hw-system-main-element-manager',
  imports: [CommonModule, FormsModule, HowellSelectComponent, SystemMainElementTableComponent],
  templateUrl: './system-main-element-manager.component.html',
  styleUrl: './system-main-element-manager.component.less',
})
export class SystemMainElementManagerComponent {
  @Input() datas: GeoMapElement[] = [];

  constructor(public source: SystemMainElementSource) {}

  title = '地图点位列表';

  table = {
    args: new SystemMainElementTableArgs(),
    load: new EventEmitter<SystemMainElementTableArgs>(),
  };

  manager = {
    on: {
      search: () => {
        this.table.load.emit(this.table.args);
      },
    },
  };
}
