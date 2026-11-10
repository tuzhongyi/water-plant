import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { Page } from '../../../common/data-core/models/interface/page-list.model';
import { TableSorterDirective } from '../../../common/directives/table-sorter/table-soater.directive';
import { Sort } from '../../../common/directives/table-sorter/table-sorter.model';
import { LocaleCompare } from '../../../common/tools/compare-tool/compare.tool';
import { PermissionTool } from '../../../common/tools/permission-tool/permission.tool';
import { SystemDeviceChannelTableBusiness } from './system-device-channel-table.business';
import {
  SystemDeviceChannelTableArgs,
  SystemDeviceChannelTableItem,
} from './system-device-channel-table.model';

@Component({
  selector: 'hw-system-device-channel-table',
  imports: [CommonModule, TableSorterDirective],
  templateUrl: './system-device-channel-table.component.html',
  styleUrl: './system-device-channel-table.component.less',
  providers: [SystemDeviceChannelTableBusiness],
})
export class SystemDeviceChannelTableComponent implements OnInit, OnDestroy {
  @Input() args: SystemDeviceChannelTableArgs = {};
  @Input('load') input_load?: EventEmitter<SystemDeviceChannelTableArgs>;
  @Input() clear?: EventEmitter<void>;
  @Output() preview = new EventEmitter<VideoChannel>();

  constructor(private business: SystemDeviceChannelTableBusiness) {}

  permission = inject(PermissionTool);

  /**	没有视频预览权限时操作栏宽度为 0，整列不占位（宽度读权限信号，权限加载后自动更新）	*/
  get widths(): string[] {
    return this.permission.preview
      ? ['18%', 'auto', '20%', '20%']
      : ['18%', 'auto', '20%', '0'];
  }
  minwidth = [];
  datas = signal<SystemDeviceChannelTableItem[]>([]);
  page = Page.create(1, 10);
  selected?: SystemDeviceChannelTableItem;
  sort: Sort = {
    active: 'no',
    direction: 'asc',
  };

  private subscription = new Subscription();

  ngOnInit(): void {
    if (this.input_load) {
      let sub = this.input_load.subscribe((x) => {
        this.args = { ...x };
        this.load(this.args);
      });
      this.subscription.add(sub);
    }
    if (this.clear) {
      let sub = this.clear.subscribe((x) => {
        this.datas.set([]);
        this.selected = undefined;
      });
      this.subscription.add(sub);
    }
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private load(args: SystemDeviceChannelTableArgs) {
    this.business.load(args).then((x) => {
      this.datas.set(x);
      this.on.sort(this.sort);
    });
  }

  onselect(item?: SystemDeviceChannelTableItem) {
    if (item) {
      if (this.selected === item) {
        this.selected = undefined;
      } else {
        this.selected = item;
      }
    }
  }

  on = {
    preview: (e: Event, item: SystemDeviceChannelTableItem) => {
      if (item.data instanceof VideoChannel) {
        this.preview.emit(item.data);
      }

      if (this.selected === item) {
        e.stopImmediatePropagation();
      }
    },
    sort: (sort: Sort) => {
      this.sort = sort;
      let datas = this.datas();
      switch (sort.active) {
        case 'name':
          datas = datas.sort((a, b) => {
            return LocaleCompare.compare(a.name, b.name, sort.direction == 'asc');
          });
          break;
        case 'no':
          datas = datas.sort((a, b) => {
            return LocaleCompare.compare(a.no, b.no, sort.direction == 'asc');
          });
          break;
        case 'state':
          datas = datas.sort((a, b) => {
            return LocaleCompare.compare(a.state.value, b.state.value, sort.direction == 'asc');
          });
          break;

        default:
          break;
      }
    },
  };
}
