import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { CardComponent } from '../../../common/components/card/card.component';
import {
  CameraEntity,
  ModelViewerModel,
  StandbyClickArgs,
} from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionComponent } from '../../../common/components/three-dimension/three-dimension.component';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { IIdNameModel } from '../../../common/data-core/models/interface/model.interface';
import { SettingMapBusiness } from '../business/setting-map.business';
import { BindingArgs, MapElementModel, MapModel } from '../business/setting-map.model';
import { SettingMapThreeConverter } from './setting-map-three.converter';

@Component({
  selector: 'hw-setting-map-three',
  imports: [CommonModule, CardComponent, ThreeDimensionComponent],
  templateUrl: './setting-map-three.component.html',
  styleUrl: './setting-map-three.component.less',
  providers: [SettingMapBusiness],
})
export class SettingMapThreeComponent implements OnInit, OnDestroy {
  @Input() standby?: IIdNameModel;
  @Input() focusCameraId?: IIdNameModel;
  @Output() maploaded = new EventEmitter<GeoMap>();
  @Output() buildingloaded = new EventEmitter<GeoMapElement[]>();
  @Output() cameraloaded = new EventEmitter<GeoMapElement[]>();
  @Output() binding = new EventEmitter<BindingArgs>();
  @Output() standbyCancel = new EventEmitter<void>();
  @Input() load?: EventEmitter<void>;
  constructor(
    private business: SettingMapBusiness,
    private toastr: ToastrService,
  ) {}

  private subs = new Subscription();
  private converter = new SettingMapThreeConverter();

  ngOnInit(): void {
    this.map.load();
    this.element.load.building();
    this.element.load.camera();
    this.regist();
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private regist() {
    if (this.load) {
      this.subs.add(
        this.load.subscribe((x) => {
          this.element.load.camera();
        }),
      );
    }
  }

  element = {
    datas: signal<MapElementModel[]>([]),
    get: (modelId: string) => {
      let elements = this.element.datas();
      return elements.find((x) => x.file?.name == modelId);
    },
    load: {
      building: () => {
        this.business.element.load(MapElementType.Building).then((buildings) => {
          this.buildingloaded.emit(buildings);

          let datas = this.three.model.datas();
          let models = buildings.map((x) => {
            return this.converter.to.building(x);
          });

          this.three.model.datas.set([...datas, ...models]);
        });
      },
      camera: () => {
        this.business.element.load(MapElementType.Camera).then((cameras) => {
          this.cameraloaded.emit(cameras);

          let datas = cameras.map((x) => this.converter.to.camera(x));
          this.three.camera.datas.set(datas);
        });
      },
    },
  };

  map = {
    data: signal<MapModel | undefined>(undefined),
    get: (modelId: string) => {
      let map = this.map.data();
      if (map && map.file && map.file.name == modelId) {
        return map;
      }
      return undefined;
    },
    load: () => {
      this.business.load().then((x) => {
        this.map.data.set(x);
        this.maploaded.emit(x);
        if (x) {
          let datas = this.three.model.datas();
          let village = this.converter.to.village(x);

          this.three.model.datas.set([...datas, village]);
        }
      });
    },
  };

  three = {
    inited: false,
    model: {
      datas: signal<ModelViewerModel[]>([]),
    },
    camera: {
      datas: signal<CameraEntity[]>([]),
    },

    on: {
      inited: () => {
        this.three.inited = true;
      },
      standby: (data: StandbyClickArgs) => {
        console.log(data);
        let parent: GeoMapElement | undefined = this.element.get(data.modelId);
        let args: BindingArgs = {
          location: { x: data.x, y: data.y, z: data.z },
          standby: data.data,
          modelId: data.modelId,
          parent: parent,
        };
        this.binding.emit(args);
      },
      standbyCancel: () => {
        this.standbyCancel.emit();
      },
    },
  };
}
