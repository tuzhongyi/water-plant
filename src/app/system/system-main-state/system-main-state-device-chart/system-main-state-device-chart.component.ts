import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { EChartAbstract } from '../../../common/tools/chart-tool/chart.abstract';
import { SystemMainDeviceState } from '../system-main-state-device/system-main-state-device.model';
import { SystemMainStateDeviceEChartOption } from './system-main-state-device-chart.option';

@Component({
  selector: 'hw-system-main-state-device-chart',
  imports: [],
  templateUrl: './system-main-state-device-chart.component.html',
  styleUrl: './system-main-state-device-chart.component.less',
})
export class SystemMainStateDeviceChartComponent
  extends EChartAbstract
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input('data') data = new SystemMainDeviceState();

  constructor() {
    super();
  }

  @ViewChild('chart') element?: ElementRef;
  option = SystemMainStateDeviceEChartOption;

  ngOnInit(): void {
    this.load();
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.load();
    }
  }

  ngAfterViewInit() {
    this.view();
  }

  ngOnDestroy() {
    this.destroy();
  }

  private load() {
    this.chart.get().then((chart) => {
      this.set.ratio(this.data);
      this.set.value(this.data);
      chart.setOption(this.option);
    });
  }

  private set = {
    ratio: (data: SystemMainDeviceState) => {
      let count = data.online + data.offline;
      let ratio = 100;
      if (count > 0) {
        ratio = (data.online / count) * 100;
      }

      this.option.series[0].data[0].value = ratio;
      this.option.series[1].data[0].value = ratio;
    },
    value: (data: SystemMainDeviceState) => {
      this.option.series[2].data[0].value = data.online;
      this.option.series[2].data[1].value = data.offline;
      this.option.series[3].data[0].value = data.online;
      this.option.series[3].data[1].value = data.offline;
    },
  };
}
