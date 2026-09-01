import { ElementRef } from '@angular/core';
import * as echarts from 'echarts';
import { PromiseValue } from '../value-tool/value.promise';

export abstract class EChartAbstract {
  abstract element?: ElementRef;
  protected chart = new PromiseValue<echarts.ECharts>();
  private handle?: any;
  private observer?: ResizeObserver;

  protected init() {
    this.handle = this.resize.bind(this);
    window.addEventListener('resize', this.handle);
  }

  protected view() {
    if (this.element) {
      let chart = echarts.init(this.element.nativeElement);
      this.chart.set(chart);
      this.observer = new ResizeObserver(this.handle);
      this.observer.observe(this.element.nativeElement);
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
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }

  private resize() {
    this.chart.get().then((chart) => {
      chart.resize();
    });
  }
}
