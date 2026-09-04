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
import { IconTool } from '../../../../common/tools/icon-tool/icon.tool';
import { LanguageTool } from '../../../../common/tools/language-tool/language.tool';
import { SystemMainThreeState } from './system-main-three-state.model';

@Component({
  selector: 'hw-system-main-three-state',
  imports: [CommonModule, CardStatisticComponent],
  templateUrl: './system-main-three-state.component.html',
  styleUrl: './system-main-three-state.component.less',
})
export class SystemMainThreeStateComponent implements OnChanges {
  @Input() title = '';
  @Input('datas') source: GeoMapElement[] = [];
  @Output() details = new EventEmitter<MapElementType | undefined>();

  constructor(
    private language: LanguageTool,
    private cdr: ChangeDetectorRef,
  ) {}

  datas: SystemMainThreeState[] = [];
  /** 面板是否展开（true 展开显示，false 折叠只留切换按钮） */
  show = true;

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
    let offline = elements.filter((x) => x.ElementState == 1);
    let warning = elements.filter((x) => x.ElementState == 2);
    let online = elements.length - offline.length - warning.length;
    let item: SystemMainThreeState = {
      icon: IconTool.MapElementType(type),
      name: await this.language.geo.ElementType(type),
      online: online,
      warning: warning.length,
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
        this.details.emit(item.type);
      } else {
        this.details.emit();
      }
    },
  };
}
