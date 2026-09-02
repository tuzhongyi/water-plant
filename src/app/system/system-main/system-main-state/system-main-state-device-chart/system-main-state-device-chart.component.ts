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
import { GlobalStorage } from '../../../../common/storage/global.storage';
import { EChartAbstract } from '../../../../common/tools/chart-tool/chart.abstract';
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

  constructor(private global: GlobalStorage) {
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
    this.global.skin.then((skin) => {
      this.set.color(skin);
      this.chart.get().then((chart) => {
        this.set.ratio(this.data);
        this.set.value(this.data);
        chart.setOption(this.option);
      });
    });
  }

  private set = {
    color: (skin: 'green' | 'blue') => {
      // 对应 CSS 变量 --primary（在线） / --sub（离线）
      const primary = skin === 'blue' ? [63, 146, 252] : [23, 241, 198];
      const sub = skin === 'blue' ? [255, 186, 59] : [255, 131, 115];
      const rgba = (c: number[], a: number) =>
        `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
      const rgb = (c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

      const option = this.option;
      // 仪表盘进度渐变
      option.series[0].progress.itemStyle.color.colorStops[0].color = rgba(primary, 0);
      option.series[0].progress.itemStyle.color.colorStops[1].color = rgb(primary);
      // 中心锚点光晕
      option.series[0].anchor.itemStyle.color.colorStops[0].color = rgba(primary, 0.5);
      option.series[0].anchor.itemStyle.color.colorStops[1].color = rgba(primary, 0);
      option.series[0].anchor.itemStyle.borderColor = rgba(primary, 0.2);
      // 内环（半透明）
      option.series[2].data[0].itemStyle.color = rgba(primary, 0.5);
      option.series[2].data[1].itemStyle.color = rgba(sub, 0.5);
      // 外环（实心）
      option.series[3].data[0].itemStyle.color = rgb(primary);
      option.series[3].data[1].itemStyle.color = rgb(sub);
    },
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
