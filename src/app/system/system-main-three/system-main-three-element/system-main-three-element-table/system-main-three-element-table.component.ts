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
import { MapElementType } from '../../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { ColorTool } from '../../../../common/tools/color-tool/color.tool';
import { LocaleCompare } from '../../../../common/tools/compare-tool/compare.tool';
import { IconTool } from '../../../../common/tools/icon-tool/icon.tool';
import { LanguageTool } from '../../../../common/tools/language-tool/language.tool';
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

  constructor(private language: LanguageTool) {}

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
    let items = [];
    for (let i = 0; i < datas.length; i++) {
      let item = await this.convert(datas[i]);
      items.push(item);
    }
    this.items = items.sort((a, b) => {
      return LocaleCompare.compare(a.type, b.type);
    });
  }

  private async convert(data: GeoMapElement) {
    let item: SystemMainThreeElementTableItem<GeoMapElement> = {
      data: data,
      id: data.Id,
      name: data.Name,
      type: data.ElementType,
      icon: IconTool.MapElementType(data.ElementType),
      color: ColorTool.from.MapElementState(data.ElementState).name,
      state: await this.language.geo.ElementStates(data.ElementState),
      playable: data.ElementType == MapElementType.Camera,
    };
    return item;
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
