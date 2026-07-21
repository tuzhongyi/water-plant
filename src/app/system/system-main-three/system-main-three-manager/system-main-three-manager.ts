import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { WheelCtrlDirective } from '../../../common/directives/wheel-ctrl/wheel-ctrl.directive';
import { ThreeDConfig } from '../../../common/storage/three-d-storage/three-d-store.model';
import { SystemMainThreeBusiness } from '../business/system-main-three.business';
import { SystemMainThreeArgs } from '../business/system-main-three.model';
import { SystemMainThreeContainerComponent } from '../system-main-three-container/system-main-three-container.component';
import { SystemMainThreeStateComponent } from '../system-main-three-state/system-main-three-state.component';

@Component({
  selector: 'hw-system-main-three-manager',
  imports: [
    CommonModule,
    WheelCtrlDirective,
    SystemMainThreeContainerComponent,
    SystemMainThreeStateComponent,
  ],
  templateUrl: './system-main-three-manager.html',
  styleUrl: './system-main-three-manager.less',
  providers: [SystemMainThreeBusiness],
})
export class SystemMainThreeManager implements OnInit, OnDestroy {
  @Input() load?: EventEmitter<void>;
  @Input() alarm?: EventEmitter<string>;
  @Output() preview = new EventEmitter<GeoMapElement>();
  @Output() video = new EventEmitter<GeoMapElement[]>();

  constructor(private business: SystemMainThreeBusiness) {}

  config?: ThreeDConfig;
  private subs = new Subscription();

  ngOnInit(): void {
    this.regist();
    this.business.config.load().then((x) => {
      this.config = x;
    });
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private regist() {
    if (this.load) {
      this.subs.add(
        this.load.subscribe((x) => {
          this.map.load.emit(this.map.args);
        }),
      );
    }
  }

  map = {
    args: new SystemMainThreeArgs(),
    load: new EventEmitter<SystemMainThreeArgs>(),
    datas: [] as GeoMapElement[],
    on: {
      loaded: (datas: GeoMapElement[]) => {
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

  on = {
    change: (value: number) => {
      if (this.config) {
        this.config.find.radius = value;
        this.business.config.save(this.config);
      }
    },
  };
}
