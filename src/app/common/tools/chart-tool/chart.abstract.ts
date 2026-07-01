import { ElementRef } from '@angular/core';
import * as echarts from 'echarts';
import { PromiseValue } from '../value-tool/value.promise';

export abstract class EChartAbstract {
  abstract element?: ElementRef;
  protected chart = new PromiseValue<echarts.ECharts>();
  private handle?: any;

  protected init() {
    this.handle = this.resize.bind(this);
    window.addEventListener('resize', this.handle);
  }

  protected view() {
    if (this.element) {
      let chart = echarts.init(this.element.nativeElement);
      this.chart.set(chart);
    }
  }
  protected destroy(): void {
    this.chart.get().then((chart) => {
      chart.dispose();
    });
    if (this.handle) {
      window.removeEventListener('resize', this.handle);
      this.handle = undefined;
    }
  }

  private resize() {
    console.log('resize');
    this.chart.get().then((chart) => {
      chart.resize();
    });
  }
}
