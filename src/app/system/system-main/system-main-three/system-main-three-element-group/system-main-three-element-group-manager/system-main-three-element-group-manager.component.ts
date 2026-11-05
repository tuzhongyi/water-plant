import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CardStatisticComponent } from '../../../../../common/components/card-statistic/card-statistic.component';
import { InputIconComponent } from '../../../../../common/components/input-icon/input-icon.component';
import { GeoMapElement } from '../../../../../common/data-core/models/geographic/map-element.model';
import { SystemMainThreeElementGroupTreeComponent } from '../system-main-three-element-group-tree/system-main-three-element-group-tree.component';

@Component({
  selector: 'hw-system-main-three-element-group-manager',
  imports: [
    CommonModule,
    CardStatisticComponent,
    InputIconComponent,
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
  };
}
