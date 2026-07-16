import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardStatistic1Component } from '../../../../common/components/card-statistic-1/card-statistic-1.component';
import { MapElementType } from '../../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { SystemMainThreeElementTableComponent } from '../system-main-three-element-table/system-main-three-element-table.component';

@Component({
  selector: 'hw-system-main-three-element-manager',
  imports: [CommonModule, CardStatistic1Component, SystemMainThreeElementTableComponent],
  templateUrl: './system-main-three-element-manager.component.html',
  styleUrl: './system-main-three-element-manager.component.less',
})
export class SystemMainThreeElementManagerComponent {
  @Input() datas: GeoMapElement[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() video = new EventEmitter<GeoMapElement[]>();
  @Output() preview = new EventEmitter<GeoMapElement>();

  get disabled() {
    return !this.datas.some((x) => x.ElementType == MapElementType.Camera);
  }

  on = {
    close: () => {
      this.close.emit();
    },
    video: () => {
      this.video.emit(this.datas.filter((x) => x.ElementType == MapElementType.Camera));
    },
    preview: (data: GeoMapElement) => {
      this.preview.emit(data);
    },
  };
}
