import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { SystemMainElementManagerComponent } from '../../system-main-element/system-main-element-manager/system-main-element-manager.component';
import { SystemMainThreeContainerComponent } from '../system-main-three-container/system-main-three-container.component';
import { SystemMainThreeStateComponent } from '../system-main-three-state/system-main-three-state.component';

@Component({
  selector: 'hw-system-main-three-manager',
  imports: [
    CommonModule,
    SystemMainThreeContainerComponent,
    SystemMainThreeStateComponent,
    SystemMainElementManagerComponent,
  ],
  templateUrl: './system-main-three-manager.html',
  styleUrl: './system-main-three-manager.less',
  providers: [],
})
export class SystemMainThreeManager implements OnInit, OnDestroy {
  @Output() preview = new EventEmitter<GeoMapElement>();
  @Output() video = new EventEmitter<GeoMapElement[]>();
  ngOnInit(): void {}
  ngOnDestroy(): void {}

  map = {
    datas: [] as GeoMapElement[],
    on: {
      loaded: (datas: GeoMapElement[]) => {
        console.log(datas);
        this.map.datas = datas;
      },
      preview: (data: GeoMapElement) => {
        this.preview.emit(data);
      },
      video: (datas: GeoMapElement[]) => {
        this.video.emit(datas);
      },
    },
  };

  state = {
    show: true,
  };
}
