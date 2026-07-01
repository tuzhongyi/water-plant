import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { TreeMapComponent } from '../../../share/tree/tree-map/tree-map.component';

@Component({
  selector: 'hw-setting-map-list',
  imports: [CommonModule, TreeMapComponent],
  templateUrl: './setting-map-list.component.html',
  styleUrl: './setting-map-list.component.less',
})
export class SettingMapListComponent implements OnInit {
  @Input() load?: EventEmitter<void>;
  @Output() details = new EventEmitter<GeoMap | undefined>();
  @Output() loaded = new EventEmitter<GeoMap[]>();
  @Input() selected?: GeoMap | GeoMapElement;
  @Output() selectedChange = new EventEmitter<GeoMap | GeoMapElement>();

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
      this.loaded.emit(datas);
    },
    select: (data?: GeoMap | GeoMapElement) => {
      this.selected = data;
      this.selectedChange.emit(this.selected);
    },
  };
}
