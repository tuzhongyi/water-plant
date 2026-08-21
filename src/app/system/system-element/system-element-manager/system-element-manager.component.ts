import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HowellSelectComponent } from '../../../common/components/hw-select/select-control.component';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { Language } from '../../../common/tools/language-tool/language';
import { SystemMainThreeSource } from '../../system-main/system-main-three/system-main-three.source';
import { SystemElementTableComponent } from '../system-element-table/system-element-table.component';
import { SystemElementTableArgs } from '../system-element-table/system-element-table.model';

@Component({
  selector: 'hw-system-element-manager',
  imports: [CommonModule, FormsModule, HowellSelectComponent, SystemElementTableComponent],
  templateUrl: './system-element-manager.component.html',
  styleUrl: './system-element-manager.component.less',
})
export class SystemElementManagerComponent implements OnChanges, OnInit {
  @Input() type?: MapElementType;
  @Input() buildingId?: string;
  @Output() preview = new EventEmitter<GeoMapElement>();
  @Output() resetstate = new EventEmitter<GeoMapElement>();
  @Input() reload?: EventEmitter<void>;
  constructor(public source: SystemMainThreeSource) {}

  Language = Language;
  private subs = new Subscription();
  ngOnChanges(changes: SimpleChanges): void {
    this.change.type(changes['type']);
    this.change.building(changes['buildingId']);
  }
  ngOnInit(): void {
    if (this.reload) {
      this.subs.add(
        this.reload.subscribe((x) => {
          this.table.args.first = false;
          this.table.load.emit(this.table.args);
        }),
      );
    }
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
      resetstate: (data: GeoMapElement) => {
        this.resetstate.emit(data);
      },
    },
  };
}
