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
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { HowellSelectComponent } from '../../../../common/components/hw-select/select-control.component';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { TextSpaceBetweenDirective } from '../../../../common/directives/text-space-between/text-space-between.directive';
import { ObjectTool } from '../../../../common/tools/object-tool/object.tool';
import { SettingMapElementSource } from '../setting-map-element.source';
import { SettingMapElementDetailsBusiness } from './setting-map-element-details.business';
import { SettingMapElementDetailsArgs } from './setting-map-element-details.model';

@Component({
  selector: 'hw-setting-map-element-details',
  imports: [CommonModule, FormsModule, TextSpaceBetweenDirective, HowellSelectComponent],
  templateUrl: './setting-map-element-details.component.html',
  styleUrl: './setting-map-element-details.component.less',
  providers: [SettingMapElementSource, SettingMapElementDetailsBusiness],
})
export class SettingMapElementDetailsComponent implements OnChanges {
  @Input() args?: SettingMapElementDetailsArgs;
  @Input('data') source?: GeoMapElement;

  @Output() ok = new EventEmitter<GeoMapElement>();
  @Output() close = new EventEmitter<void>();

  constructor(
    public _source: SettingMapElementSource,
    private business: SettingMapElementDetailsBusiness,
    private toastr: ToastrService,
  ) {}

  data = this.init();
  ngOnChanges(changes: SimpleChanges): void {
    this.change.args(changes['args']);
    this.change.args(changes['source']);
  }
  ngOnInit(): void {
    if (this.source) {
      this.data = ObjectTool.assign(this.source, GeoMapElement);
    }
  }

  private change = {
    source: (change: SimpleChange) => {
      if (change) {
        if (this.source) {
          this.data = ObjectTool.assign(this.source, GeoMapElement);
        }
      }
    },
    args: (change: SimpleChange) => {
      if (change) {
        if (this.args) {
          this.data.ParentId = this.args.parent.Id;
          this.data.MapId = this.args.mapId;
          if (this.args.type) {
            this.data.ElementType = this.args.type;
          }
        }
      }
    },
  };

  private init() {
    let data = new GeoMapElement();

    return data;
  }

  private get check() {
    if (!this.data.Name) {
      this.toastr.warning('请输入元素名称');
      return false;
    }
    if (!this.data.ElementType) {
      this.toastr.warning('请选择元素类型');
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
