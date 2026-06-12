import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { CardComponent } from '../../../common/components/card/card.component';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { MapTreeComponent } from '../../../share/map-tree/map-tree.component';

@Component({
  selector: 'hw-setting-map-list',
  imports: [CommonModule, CardComponent, MapTreeComponent],
  templateUrl: './setting-map-list.component.html',
  styleUrl: './setting-map-list.component.less',
})
export class SettingMapListComponent implements OnInit {
  @Input() load?: EventEmitter<void>;
  @Output() details = new EventEmitter<GeoMap | undefined>();

  constructor() {}

  private subs = new Subscription();
  private regist() {
    if (this.load) {
      this.subs.add(
        this.load.subscribe((x) => {
          this.tree.load.emit();
        }),
      );
    }
  }

  ngOnInit(): void {
    this.regist();
  }

  tree = {
    load: new EventEmitter<void>(),
    loaded: (datas: GeoMap[]) => {
      if (datas.length == 0) {
        this.details.emit();
      }
    },
  };
}
