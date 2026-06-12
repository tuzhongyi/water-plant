import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { TextSpaceBetweenDirective } from '../../../common/directives/text-space-between/text-space-between.directive';
import { ObjectTool } from '../../../common/tools/object-tool/object.tool';
import { SettingMapElementDetailsBusiness } from './setting-map-element-details.business';

@Component({
  selector: 'hw-setting-map-element-details',
  imports: [CommonModule, FormsModule, TextSpaceBetweenDirective],
  templateUrl: './setting-map-element-details.component.html',
  styleUrl: './setting-map-element-details.component.less',
  providers: [SettingMapElementDetailsBusiness],
})
export class SettingMapElementDetailsComponent implements OnInit {
  @Input('data') source?: GeoMapElement;

  @Output() ok = new EventEmitter<GeoMapElement>();
  @Output() close = new EventEmitter<void>();

  constructor(
    private business: SettingMapElementDetailsBusiness,
    private toastr: ToastrService,
  ) {}

  data = this.init();

  ngOnInit(): void {
    if (this.source) {
      this.data = ObjectTool.assign(this.source, GeoMapElement);
    }
  }

  private init() {
    let data = new GeoMapElement();

    return data;
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
        let promise: Promise<GeoMapElement>;
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
