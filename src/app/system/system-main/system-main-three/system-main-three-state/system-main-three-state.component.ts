import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { CardStatisticComponent } from '../../../../common/components/card-statistic/card-statistic.component';
import { MapElementType } from '../../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { ArrayTool } from '../../../../common/tools/array-tool/array.tool';
import { ElementStateTool } from '../../../../common/tools/element-state-tool/element-state.tool';
import { IconTool } from '../../../../common/tools/icon-tool/icon.tool';
import { LanguageTool } from '../../../../common/tools/language-tool/language.tool';
import { SystemMainThreeState } from './system-main-three-state.model';

@Component({
  selector: 'hw-system-main-three-state',
  imports: [CommonModule, CardStatisticComponent],
  templateUrl: './system-main-three-state.component.html',
  styleUrl: './system-main-three-state.component.less',
  host: {
    '[class.left]': "side === 'left'",
    '[class.right]': "side === 'right'",
  },
})
export class SystemMainThreeStateComponent implements OnChanges {
  /**	面板停靠在容器的哪一侧：left 向左上角折叠，right 向右上角折叠	*/
  @Input() side: 'left' | 'right' = 'left';
  @Input() title = '';
  @Input('datas') source: GeoMapElement[] = [];
  @Output() details = new EventEmitter<{ type?: MapElementType; state?: number }>();

  constructor(
    private language: LanguageTool,
    private cdr: ChangeDetectorRef,
    private elementstate: ElementStateTool,
  ) {}

  datas: SystemMainThreeState[] = [];
  /** 面板是否展开（true 展开显示，false 折叠只留切换按钮） */
  show = true;
  /**	折叠按钮图标：展开时指向折叠方向，折叠后指向展开方向	*/
  get icon(): string {
    let left = this.show ? this.side === 'left' : this.side === 'right';
    return left ? 'mdi mdi-chevron-left' : 'mdi mdi-chevron-right';
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.change.source(changes['source']);
  }

  private change = {
    source: (change: SimpleChange) => {
      if (change) {
        this.load(this.source);
      }
    },
  };

  private async load(datas: GeoMapElement[]) {
    let group = ArrayTool.groupBy(datas, (x) => {
      return x.ElementType;
    });

    let items: SystemMainThreeState[] = [];
    for (const key in group) {
      let item = await this.convert(parseInt(key), group[key]);
      items.push(item);
    }
    this.datas = items;
    this.cdr.detectChanges();
  }
  private async convert(type: number, elements: GeoMapElement[]) {
    /*	状态口径与场景 marker / 元素列表一致（统一走 ElementStateTool）：0-正常，1-离线，2-报警；
        DB31 元素取不到 ElementState 时按父设备状态；没有状态（undefined）的同样按离线算，
        不能算成在线（以前用「总数 - 离线 - 报警」倒推在线，会把 undefined 算进在线里） */
    let states = await Promise.all(elements.map((x) => this.elementstate.state(x)));
    let online = states.filter((x) => x == 0);
    let warning = states.filter((x) => x == 2);
    let offline = states.filter((x) => this.elementstate.offline(x));
    let item: SystemMainThreeState = {
      icon: IconTool.MapElementType(type),
      name: await this.language.geo.ElementType(type),
      online: online.length,
      /* 异常 = 报警 + 离线 */
      warning: warning.length + offline.length,
      type: type,
    };
    return item;
  }

  on = {
    toggle: () => {
      this.show = !this.show;
    },
    details: (item?: SystemMainThreeState) => {
      if (item) {
        this.details.emit({ type: item.type });
      } else {
        this.details.emit({});
      }
    },
    /**	点击在线/异常数字：带上类型和状态，父组件弹窗里只显示该状态的元素；
        0-在线，1-离线（异常里还包含报警，报警元素按离线口径筛选）	*/
    metric: (e: Event, item: SystemMainThreeState, state: number) => {
      e.stopPropagation();
      this.details.emit({ type: item.type, state });
    },
  };
}
