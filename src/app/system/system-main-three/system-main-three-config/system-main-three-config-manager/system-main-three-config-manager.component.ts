import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ThreeDConfig } from '../../../../common/storage/three-d-storage/three-d-store.model';
import { SystemMainThreeBusiness } from '../../business/system-main-three.business';
import { SystemMainThreeConfigFindComponent } from '../system-main-three-config-find/system-main-three-config-find.component';
import { SystemMainThreeConfigMapMarkerComponent } from '../system-main-three-config-map-marker/system-main-three-config-map-marker.component';
import { SystemMainThreeConfigMapModelComponent } from '../system-main-three-config-map-model/system-main-three-config-map-model.component';

@Component({
  selector: 'hw-system-main-three-config-manager',
  imports: [
    CommonModule,
    SystemMainThreeConfigFindComponent,
    SystemMainThreeConfigMapMarkerComponent,
    SystemMainThreeConfigMapModelComponent,
  ],
  templateUrl: './system-main-three-config-manager.component.html',
  styleUrl: './system-main-three-config-manager.component.less',
  providers: [SystemMainThreeBusiness],
})
export class SystemMainThreeConfigManagerComponent implements OnInit {
  constructor(private business: SystemMainThreeBusiness) {}

  config?: ThreeDConfig;

  ngOnInit(): void {
    this.load();
  }

  private load() {
    this.business.config.load().then((x) => {
      this.config = x;
    });
  }

  on = {
    change: () => {
      if (this.config) {
        this.business.config.save(this.config);
      }
    },
  };
}
