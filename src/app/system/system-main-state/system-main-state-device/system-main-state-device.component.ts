import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import { CardComponent } from '../../../common/components/card/card.component';
import { Device } from '../../../common/data-core/models/devices/device.model';
import { SystemMainStateDeviceChartComponent } from '../system-main-state-device-chart/system-main-state-device-chart.component';
import { SystemMainDeviceState } from './system-main-state-device.model';

@Component({
  selector: 'hw-system-main-state-device',
  imports: [CommonModule, CardComponent, SystemMainStateDeviceChartComponent],
  templateUrl: './system-main-state-device.component.html',
  styleUrl: './system-main-state-device.component.less',
})
export class SystemMainStateDeviceComponent implements OnChanges {
  @Input('datas') source: Device[] = [];

  constructor() {}
  data = new SystemMainDeviceState();
  ngOnChanges(changes: SimpleChanges): void {
    this.change.source(changes['source']);
  }

  private change = {
    source: (change: SimpleChange) => {
      if (change) {
        this.load(this.source);
      }
    },
  };

  private load(datas: Device[]) {
    let state = new SystemMainDeviceState();
    datas.forEach((x) => {
      if (x.DeviceState) {
        state.offline++;
      } else {
        state.online++;
      }
    });
    this.data = state;
  }
}
