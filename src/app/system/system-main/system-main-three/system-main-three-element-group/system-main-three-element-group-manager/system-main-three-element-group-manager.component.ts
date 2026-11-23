import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CardStatisticComponent } from '../../../../../common/components/card-statistic/card-statistic.component';
import { InputIconComponent } from '../../../../../common/components/input-icon/input-icon.component';
import { WindowConfirmComponent } from '../../../../../common/components/window-confirm/window-confirm.component';
import { WindowViewModel } from '../../../../../common/components/window-control/window.model';
import { GeoMapElement } from '../../../../../common/data-core/models/geographic/map-element.model';
import { DB31RequestService } from '../../../../../common/data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../../../../common/data-core/request/services/device/device.service';
import { GeographicRequestService } from '../../../../../common/data-core/request/services/geographic/geographic.service';
import { PermissionTool } from '../../../../../common/tools/permission-tool/permission.tool';
import { SystemMainThreeElementGroupTreeComponent } from '../system-main-three-element-group-tree/system-main-three-element-group-tree.component';

@Component({
  selector: 'hw-system-main-three-element-group-manager',
  imports: [
    CommonModule,
    CardStatisticComponent,
    InputIconComponent,
    WindowConfirmComponent,
    SystemMainThreeElementGroupTreeComponent,
  ],
  templateUrl: './system-main-three-element-group-manager.component.html',
  styleUrl: './system-main-three-element-group-manager.component.less',
  host: {
    '[class.left]': "side === 'left'",
    '[class.right]': "side === 'right'",
  },
})
export class SystemMainThreeElementGroupManagerComponent {
  /**	面板停靠在容器的哪一侧：left 向左上角折叠，right 向右上角折叠	*/
  @Input() side: 'left' | 'right' = 'right';
  @Input() title = '点位分组';
  /**	全部地图元素（含楼栋/楼层），由 main 传入 */
  @Input() datas: GeoMapElement[] = [];
  /**	被隐藏的点位 Id：透传给树，决定眼睛图标状态 */
  @Input() hiddenIds: ReadonlySet<string> = new Set<string>();
  /**	面板是否展开：外部据此把被遮挡的按钮让出来 */
  @Input() show = true;
  @Output() showChange = new EventEmitter<boolean>();
  /**	定位到点位所在位置 */
  @Output() position = new EventEmitter<GeoMapElement>();
  /**	双击摄像机点位：播放实时视频预览 */
  @Output() preview = new EventEmitter<GeoMapElement>();
  /**	显示/隐藏点位 */
  @Output() visible = new EventEmitter<GeoMapElement>();
  /**	分组节点：批量显示/隐藏该分组下的全部点位 */
  @Output() visibleAll = new EventEmitter<{ ids: string[]; visible: boolean }>();
  /**	名称同步完成：通知上层重新加载点位和分组树	*/
  @Output() synced = new EventEmitter<void>();

  private geo = inject(GeographicRequestService);
  private device = inject(DeviceRequestService);
  private db31 = inject(DB31RequestService);
  private toastr = inject(ToastrService);
  permission = inject(PermissionTool);

  window = {
    sync: new WindowViewModel(),
    content: '是否将地图点位名称同步为对应摄像机的通道名称？',
    style: { width: '420px', height: 'auto' },
  };

  /**	折叠按钮图标：展开时指向折叠方向，折叠后指向展开方向	*/
  get icon(): string {
    let left = this.show ? this.side === 'left' : this.side === 'right';
    return left ? 'mdi mdi-chevron-left' : 'mdi mdi-chevron-right';
  }

  /**	搜索框：输入值实时更新，点按钮 / 回车 / 清空时才把关键字交给树，
      避免每敲一个字就重建一次树（与 hw-tree-device 由外部触发搜索的方式一致） */
  search = {
    /** 输入框里的值 */
    value: '',
    /** 已生效的关键字：树按它过滤节点名称 */
    name: '',
  };

  on = {
    toggle: () => {
      this.show = !this.show;
      this.showChange.emit(this.show);
    },
    search: () => {
      this.search.name = this.search.value.trim();
    },
    sync: {
      open: () => this.window.sync.show.set(true),
      cancel: () => this.window.sync.show.set(false),
      ok: () => {
        this.window.sync.show.set(false);
        this.sync();
      },
    },
  };

  /**	名称同步：以 ElementId 绑定设备的名称更新地图点位名称，
      只处理名称不一致的点位，失败计数提示 */
  private async sync() {
    let elements = this.datas.filter((x) => !!x.ElementId);
    let success = 0;
    let error = 0;
    for (const element of elements) {
      let name = await this.name(element);
      if (!name || name === element.Name) continue;
      try {
        element.Name = name;
        await this.geo.map.element.update(element);
        success++;
      } catch {
        error++;
      }
    }
    if (error > 0) this.toastr.error(`同步失败 ${error} 个`);
    if (success > 0) {
      /* 名称已更新，清掉元素缓存，其他列表/地图重新读取时拿到新名称 */
      this.geo.map.element.cache.clear();
      this.toastr.success(`同步成功 ${success} 个`);
      this.synced.emit();
    } else if (error === 0) {
      this.toastr.info('名称已一致，无需同步');
    }
  }

  /**	ElementId 绑定设备的名称：
      DB31 元素取 DB31 通道名称（取不到再取 DB31 设备名称）；
      其他元素取视频通道名称（取不到再取设备名称）	*/
  private async name(data: GeoMapElement): Promise<string | undefined> {
    if (!data.ElementId) return undefined;
    if (data.FromDB31) {
      try {
        let channel = await this.db31.channel.cache.get(data.ElementId);
        if (channel?.Name) return channel.Name;
      } catch {}
      try {
        let device = await this.db31.device.cache.get(data.ElementId);
        return device?.Name;
      } catch {
        return undefined;
      }
    }
    try {
      let channel = await this.device.video.channel.cache.get(data.ElementId);
      if (channel?.Name) return channel.Name;
    } catch {}
    try {
      let device = await this.device.cache.get(data.ElementId);
      return device?.Name;
    } catch {
      return undefined;
    }
  }
}
