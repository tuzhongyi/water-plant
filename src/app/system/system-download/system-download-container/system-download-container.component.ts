import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  signal,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CardComponent } from '../../../common/components/card/card.component';
import { DateTimeControlComponent } from '../../../common/components/date-time-control/date-time-control.component';
import { TimeControlComponent } from '../../../common/components/time-control/time-control.component';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { DateTimeTool } from '../../../common/tools/date-time-tool/datetime.tool';
import { SystemDownloadBusiness } from '../business/system-download.business';
import { DownloadTask } from '../business/system-download.model';
import { SystemDownloadTableComponent } from '../system-download-table/system-download-table.component';

@Component({
  selector: 'hw-system-download-container',
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    DateTimeControlComponent,
    TimeControlComponent,
    SystemDownloadTableComponent,
  ],
  templateUrl: './system-download-container.component.html',
  styleUrl: './system-download-container.component.less',
  providers: [SystemDownloadBusiness],
})
export class SystemDownloadContainerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data?: RegionTreeNode;

  private subs = new Subscription();

  constructor(public business: SystemDownloadBusiness) {}

  disabled = true;

  ngOnInit(): void {
    this.regist();
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.change.data(changes['data']);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private regist() {
    this.subs.add(
      this.business.changes.subscribe((tasks) => {
        console.log('[download] business.changes 任务数=', tasks.length);
        this.table.datas.set(tasks);
      }),
    );
  }

  private change = {
    data: (change: SimpleChange) => {
      if (change) {
        if (this.data) {
          this.disabled = this.data.RegionNodeType != 2;
        } else {
          this.disabled = true;
        }
      }
    },
  };

  table = {
    datas: signal<DownloadTask[]>([]),
    on: {
      pause: (task: DownloadTask) => this.business.pause(task.id),
      resume: (task: DownloadTask) => this.business.resume(task.id),
      cancel: (task: DownloadTask) => this.business.cancel(task.id),
      retry: (task: DownloadTask) => this.business.retry(task.id),
      redownload: (task: DownloadTask) => this.business.redownload(task.id),
      remove: (task: DownloadTask) => this.business.remove(task.id),
    },
  };

  manager = {
    date: new Date(),
    time: DateTimeTool.before(new Date(), 30 * 60),
    on: {
      date: () => {
        let year = this.manager.date.getFullYear();
        let month = this.manager.date.getMonth();
        let day = this.manager.date.getDate();

        this.manager.time.begin.setFullYear(year);
        this.manager.time.begin.setMonth(month);
        this.manager.time.begin.setDate(day);

        this.manager.time.end.setFullYear(year);
        this.manager.time.end.setMonth(month);
        this.manager.time.end.setDate(day);
      },
      download: async () => {
        console.log('[download] 点击下载, data=', this.data, 'disabled=', this.disabled);
        if (this.data) {
          let args = {
            duration: this.manager.time,
            name: this.data.Name,
            channelId: this.data.Id,
          };
          let tasks = this.business.download(args);
          console.log('[download] 创建任务数=', tasks.length);
          this.table.datas.set(tasks);
        }
      },
    },
  };
}
