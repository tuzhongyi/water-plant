import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TableSorterDirective } from '../../../common/directives/table-sorter/table-soater.directive';
import { Sort, SortDirection } from '../../../common/directives/table-sorter/table-sorter.model';
import { DownloadTask } from '../business/system-download.model';

@Component({
  selector: 'hw-system-download-table',
  imports: [CommonModule, TableSorterDirective],
  templateUrl: './system-download-table.component.html',
  styleUrl: './system-download-table.component.less',
})
export class SystemDownloadTableComponent implements OnChanges {
  @Input() datas: DownloadTask[] = [];
  @Output() pause = new EventEmitter<DownloadTask>();
  @Output() resume = new EventEmitter<DownloadTask>();
  @Output() cancel = new EventEmitter<DownloadTask>();
  @Output() retry = new EventEmitter<DownloadTask>();
  @Output() redownload = new EventEmitter<DownloadTask>();
  @Output() remove = new EventEmitter<DownloadTask>();

  constructor() {}

  widths = ['6%', 'auto', '11%', '11%', '11%', '18%', '8%', '12%'];

  /**	排序后的展示列表 */
  view: DownloadTask[] = [];
  private sort?: Sort;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datas']) {
      console.log('[download-table] datas 变化, 数量=', changes['datas'].currentValue?.length);
      if (this.sort) {
        this.on.sort(this.sort);
      } else {
        this.view = [...this.datas];
      }
      console.log('[download-table] view 数量=', this.view.length);
    }
  }

  /* ---- 展示工具 ---- */

  percent(task: DownloadTask): number {
    if (task.total <= 0) return 0;
    return Math.min(100, Math.max(0, (task.loaded / task.total) * 100));
  }

  bytes(n: number): string {
    if (!n || n <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let v = n;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  speedText(n: number): string {
    return `${this.bytes(n)}/s`;
  }

  stateText(task: DownloadTask): string {
    switch (task.state) {
      case 'queued':
        return '排队中';
      case 'downloading':
        return '下载中';
      case 'paused':
        return '已暂停';
      case 'saving':
        return '保存中';
      case 'completed':
        return '已完成';
      case 'failed':
        return task.message || '失败';
      default:
        return '';
    }
  }

  on = {
    sort: (sort: Sort) => {
      this.sort = sort;
      const { active, direction } = this.sort;
      const list = [...this.datas];
      if (active && direction) {
        list.sort((a, b) => this.compare(a, b, active, direction));
      }
      this.view = list;
    },
  };

  private compare(
    a: DownloadTask,
    b: DownloadTask,
    active: string,
    direction: SortDirection,
  ): number {
    let result = 0;
    switch (active) {
      case 'name':
        result = a.name.localeCompare(b.name);
        break;
      case 'date':
      case 'begin':
        result = a.duration.begin.getTime() - b.duration.begin.getTime();
        break;
      case 'end':
        result = a.duration.end.getTime() - b.duration.end.getTime();
        break;
      case 'progress':
        result = this.percent(a) - this.percent(b);
        break;
      case 'state':
        result = a.state.localeCompare(b.state);
        break;
    }
    return direction === 'desc' ? -result : result;
  }
}
