import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HowellSelectComponent } from '../../../common/components/hw-select/select-control.component';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { Language } from '../../../common/tools/language-tool/language';
import { SystemMainThreeSource } from '../../system-main-three/system-main-three.source';
import { SystemElementTableComponent } from '../system-element-table/system-element-table.component';
import { SystemElementTableArgs } from '../system-element-table/system-element-table.model';

@Component({
  selector: 'hw-system-element-manager',
  imports: [CommonModule, FormsModule, HowellSelectComponent, SystemElementTableComponent],
  templateUrl: './system-element-manager.component.html',
  styleUrl: './system-element-manager.component.less',
})
export class SystemElementManagerComponent implements OnChanges {
  @Input() type?: MapElementType;
  @Input() buildingId?: string;
  @Output() preview = new EventEmitter<GeoMapElement>();
  constructor(public source: SystemMainThreeSource) {}
  Language = Language;
  ngOnChanges(changes: SimpleChanges): void {
    this.change.type(changes['type']);
    this.change.building(changes['buildingId']);
  }

  private change = {
    type: (change: SimpleChange) => {
      if (change) {
        this.table.args.type = this.type;
      }
    },
    building: (change: SimpleChange) => {
      if (change) {
        this.table.args.buildingId = this.buildingId;
      }
    },
  };

  table = {
    args: new SystemElementTableArgs(),
    load: new EventEmitter<SystemElementTableArgs>(),
    on: {
      search: () => {
        this.table.args.first = true;
        this.table.load.emit(this.table.args);
      },
      preview: (data: GeoMapElement) => {
        this.preview.emit(data);
      },
    },
  };
}
