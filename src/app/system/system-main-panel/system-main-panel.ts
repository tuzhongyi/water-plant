import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import { CardStatistic1Component } from '../../common/components/card-statistic-1/card-statistic-1.component';
import { NameValue } from '../../common/data-core/models/capabilities/enum-name-value.model';
import { Device } from '../../common/data-core/models/devices/device.model';
import { ArrayTool } from '../../common/tools/array-tool/array.tool';
import { LanguageTool } from '../../common/tools/language-tool/language.tool';

@Component({
  selector: 'hw-system-main-panel',
  imports: [CommonModule, CardStatistic1Component],
  templateUrl: './system-main-panel.html',
  styleUrl: './system-main-panel.less',
})
export class SystemMainPanel implements OnChanges {
  @Input() title = '';
  @Input('datas') source: Device[] = [];

  constructor(private language: LanguageTool) {}

  items: NameValue<number>[] = [];

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

  private async load(datas: Device[]) {
    let group = ArrayTool.groupBy(datas, (x) => {
      return x.DeviceType;
    });

    this.items = [];
    for (const key in group) {
      let type = parseInt(key);
      let name = await this.language.device.DeviceType(type);
      let item = new NameValue<number>();
      item.Name = name;
      item.Value = group[key].length;
      this.items.push(item);
    }
  }
}
