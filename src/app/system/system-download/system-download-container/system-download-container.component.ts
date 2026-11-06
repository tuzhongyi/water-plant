import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
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
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { RegionTreeNode } from '../../../common/data-core/models/regions/region-tree-node.model';
import { DateTimePickerView } from '../../../common/directives/date-time-picker/date-time-picker.directive';
import { DateTimeTool } from '../../../common/tools/date-time-tool/datetime.tool';
import { Language } from '../../../common/tools/language-tool/language';
import { PermissionTool } from '../../../common/tools/permission-tool/permission.tool';
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
    SystemDownloadTableComponent,
  ],
  templateUrl: './system-download-container.component.html',
  styleUrl: './system-download-container.component.less',
  providers: [SystemDownloadBusiness],
})
export class SystemDownloadContainerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data?: RegionTreeNode | VideoChannel;

  private subs = new Subscription();

  constructor(public business: SystemDownloadBusiness) {}
  permission = inject(PermissionTool);
  disabled = true;
  View = DateTimePickerView;
  Language = Language;

  ngOnInit(): void {
    this.regist();
    /*	下载页可能是新窗口直接打开的（不经系统页），那里不会加载权限组，
        不加载的话 permission.download 永远是 false；这里自己加载一次 */
    this.permission.load().catch(() => {});
    this.manager.time.begin.setSeconds(0);
    this.manager.time.end.setSeconds(0);
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
        if (this.data instanceof RegionTreeNode) {
          this.disabled = this.data.RegionNodeType != 2;
        } else if (this.data instanceof VideoChannel) {
          this.disabled = false;
        } else {
          this.disabled = true;
        }
      }
    },
  };

  /**	会真正发起下载的操作统一走这里：没有下载权限时一律不执行
      （按钮已按权限禁用，这里是兜底，避免通过其它入口调用） */
  private allow(action: () => void): void {
    if (!this.permission.download) return;
    action();
  }

  table = {
    datas: signal<DownloadTask[]>([]),
    on: {
      pause: (task: DownloadTask) => this.business.pause(task.id),
      resume: (task: DownloadTask) => this.allow(() => this.business.resume(task.id)),
      cancel: (task: DownloadTask) => this.business.cancel(task.id),
      retry: (task: DownloadTask) => this.allow(() => this.business.retry(task.id)),
      redownload: (task: DownloadTask) => this.allow(() => this.business.redownload(task.id)),
      remove: (task: DownloadTask) => this.business.remove(task.id),
    },
  };

  manager = {
    time: DateTimeTool.before(new Date(), 30 * 60),
    on: {
      download: async () => {
        console.log('[download] 点击下载, data=', this.data, 'disabled=', this.disabled);
        if (!this.permission.download) return;
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
