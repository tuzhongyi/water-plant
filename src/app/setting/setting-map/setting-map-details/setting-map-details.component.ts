import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { TextSpaceBetweenDirective } from '../../../common/directives/text-space-between/text-space-between.directive';
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';
import { SettingMapDetailsBusiness } from './setting-map-details.business';

@Component({
  selector: 'hw-setting-map-details',
  imports: [CommonModule, FormsModule, TextSpaceBetweenDirective],
  templateUrl: './setting-map-details.component.html',
  styleUrl: './setting-map-details.component.less',
  providers: [SettingMapDetailsBusiness],
})
export class SettingMapDetailsComponent implements OnInit {
  @Input('data') source?: GeoMap;

  @Output() ok = new EventEmitter<GeoMap>();
  @Output() close = new EventEmitter<void>();

  constructor(
    private business: SettingMapDetailsBusiness,
    private toastr: ToastrService,
  ) {}

  data = this.init();

  ngOnInit(): void {
    if (this.source) {
      this.data = ObjectTool.assign(this.source, GeoMap);
    }
  }

  private init() {
    let map = new GeoMap();
    map.MapType = 1;
    return map;
  }

  get check() {
    if (!this.data.Name) {
      this.toastr.warning('请输入地图名称');
      return false;
    }
    return true;
  }

  on = {
    ok: () => {
      if (this.check) {
        let promise: Promise<GeoMap>;
        if (this.source) {
          promise = this.business.update(this.data);
        } else {
          promise = this.business.create(this.data);
        }
        promise
          .then((x) => {
            this.toastr.success('操作成功');
            this.ok.emit(x);
          })
          .catch((e) => {
            this.toastr.error('操作失败');
          });
      }
    },
    close: () => {
      this.close.emit();
    },
  };
}
