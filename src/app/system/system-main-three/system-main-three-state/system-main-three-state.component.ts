import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { CardStatistic1Component } from '../../../common/components/card-statistic-1/card-statistic-1.component';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { ArrayTool } from '../../../common/tools/array-tool/array.tool';
import { IconTool } from '../../../common/tools/icon-tool/icon.tool';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import { TreeMapElementComponent } from '../../../share/tree/tree-map-element/tree-map-element.component';
import { SystemMainThreeState } from './system-main-three-state.model';

@Component({
  selector: 'hw-system-main-three-state',
  imports: [CommonModule, CardStatistic1Component, TreeMapElementComponent],
  templateUrl: './system-main-three-state.component.html',
  styleUrl: './system-main-three-state.component.less',
})
export class SystemMainThreeStateComponent implements OnChanges {
  @Input() title = '';
  @Input('datas') source: GeoMapElement[] = [];
  @Output() hide = new EventEmitter<void>();

  constructor(private language: LanguageTool) {}

  datas: SystemMainThreeState[] = [];

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
    hide: () => {
      this.hide.emit();
    },
  };
}
