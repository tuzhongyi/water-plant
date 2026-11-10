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
import { MapElementType } from '../../../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../../../common/data-core/models/geographic/map-element.model';
import { ColorTool } from '../../../../../common/tools/color-tool/color.tool';
import { LocaleCompare } from '../../../../../common/tools/compare-tool/compare.tool';
import { ElementStateTool } from '../../../../../common/tools/element-state-tool/element-state.tool';
import { IconTool } from '../../../../../common/tools/icon-tool/icon.tool';
import { LanguageTool } from '../../../../../common/tools/language-tool/language.tool';
import { SystemMainThreeElementTableItem } from './system-main-three-element-table.model';

@Component({
  selector: 'hw-system-main-three-element-table',
  imports: [CommonModule],
  templateUrl: './system-main-three-element-table.component.html',
  styleUrl: './system-main-three-element-table.component.less',
})
export class SystemMainThreeElementTableComponent implements OnChanges {
  @Input() datas: GeoMapElement[] = [];
  @Output() preview = new EventEmitter<GeoMapElement>();
  @Output() video = new EventEmitter<GeoMapElement[]>();

  constructor(
    private language: LanguageTool,
    private cdr: ChangeDetectorRef,
    private elementstate: ElementStateTool,
  ) {}

  items: SystemMainThreeElementTableItem[] = [];
  width: string[] = ['30px', 'calc(100% - 30px * 2)', '30px'];
  selecteds: SystemMainThreeElementTableItem[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.change.datas(changes['datas']);
  }

  private change = {
    datas: (change: SimpleChange) => {
      if (change) {
        this.load(this.datas);
      }
    },
  };

  private async load(datas: GeoMapElement[]) {
    const items = await Promise.all(datas.map((x) => this.convert(x)));
    this.items = items.sort((a, b) => {
      return LocaleCompare.compare(a.type, b.type);
    });
    /*	状态要先异步解析（DB31 回退父设备状态）再赋值，需要主动触发变更检测 */
    this.cdr.detectChanges();
  }

  private async convert(data: GeoMapElement): Promise<SystemMainThreeElementTableItem<GeoMapElement>> {
    /*	状态口径与场景 marker / 统计面板 / 元素列表一致（统一走 ElementStateTool）；
        没有状态（undefined）的点位同样按离线显示（灰） */
    let state = await this.elementstate.state(data);
    return {
      data: data,
      id: data.Id,
      name: data.Name,
      type: data.ElementType,
      icon: IconTool.MapElementType(data.ElementType),
      color: ColorTool.from.MapElementState(this.elementstate.offline(state) ? 1 : state).name,
      playable: data.ElementType == MapElementType.Camera,
    };
  }

  on = {
    preview: (e: Event, item: SystemMainThreeElementTableItem) => {
      this.preview.emit(item.data);
    },
    select: (item: SystemMainThreeElementTableItem) => {
      let index = this.selecteds.findIndex((x) => x.id == item.id);
      if (index < 0) {
        this.selecteds.push(item);
      } else {
        this.selecteds.splice(index, 1);
      }
    },
  };
}
