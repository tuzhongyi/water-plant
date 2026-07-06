import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  signal,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { CardComponent } from '../../../common/components/card/card.component';
import {
  FitView,
  MarkerArgs,
  MarkerEntity,
  ModelFile,
  ModelViewerModel,
  StandbyClickArgs,
} from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionComponent } from '../../../common/components/three-dimension/three-dimension.component';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { IIdNameModel } from '../../../common/data-core/models/interface/model.interface';
import { wait } from '../../../common/tools/wait';
import { SettingMapBusiness } from '../business/setting-map.business';
import { BindingArgs, MapModel } from '../business/setting-map.model';
import { SettingMapThreeConverter } from './setting-map-three.converter';

@Component({
  selector: 'hw-setting-map-three',
  imports: [CommonModule, CardComponent, ThreeDimensionComponent],
  templateUrl: './setting-map-three.component.html',
  styleUrl: './setting-map-three.component.less',
  providers: [SettingMapBusiness, SettingMapThreeConverter],
})
export class SettingMapThreeComponent implements OnChanges, OnInit, OnDestroy {
  @Input() standby?: IIdNameModel;
  @Input() focusCameraId?: IIdNameModel;
  @Output() maploaded = new EventEmitter<GeoMap>();

  @Output() buildingloaded = new EventEmitter<GeoMapElement[]>();
  @Output() buildingselect = new EventEmitter<GeoMapElement>();

  @Output() elementloaded = new EventEmitter<GeoMapElement[]>();
  @Output() binding = new EventEmitter<BindingArgs>();
  @Output() standbyCancel = new EventEmitter<void>();
  @Input() load?: EventEmitter<void>;
  constructor(
    private business: SettingMapBusiness,
    private converter: SettingMapThreeConverter,
    private toastr: ToastrService,
  ) {}

  private subs = new Subscription();
  outputable = true;
  ngOnChanges(changes: SimpleChanges): void {
    this.change.standby(changes['standby']);
  }
  ngOnInit(): void {
    this.map.load();
    this.building.load();
    this.element.load();
    this.regist();
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private change = {
    standby: (change: SimpleChange) => {
      if (change) {
        if (this.standby) {
          let entity = this.converter.args.from.data(this.standby);
          this.element.standby.set(entity);
        } else {
          this.element.standby.set(undefined);
        }
      }
    },
  };

  private regist() {
    if (this.load) {
      this.subs.add(
        this.load.subscribe((x) => {
          let floorId = this.floor.selected()?.Id;

          this.element.load(floorId);
        }),
      );
    }
  }
  building = {
    datas: signal<GeoMapElement[]>([]),
    get: (modelId: string) => {
      let elements = this.building.datas();
      return elements.find((x) => x.ElementId == modelId);
    },
    load: async () => {
      let buildings = await this.business.element.building.load();
      this.building.datas.set(buildings);
      if (this.outputable) {
        this.buildingloaded.emit(buildings);
      }

      await wait(() => {
        return this.three.inited;
      });

      let datas = this.three.model.datas();
      let models = buildings.map((x) => {
        return this.converter.element.to.building(x);
      });
      this.three.model.datas.set([...datas, ...models]);
    },
  };
  element = {
    standby: signal<MarkerArgs | undefined>(undefined),
    datas: signal<GeoMapElement[]>([]),
    get: (modelId: string) => {
      let elements = this.element.datas();
      return elements.find((x) => x.ElementId == modelId);
    },
    load: async (floorId?: string) => {
      let cameras = await this.business.element.load(floorId);

      this.element.datas.set(cameras);
      if (this.outputable) {
        this.elementloaded.emit(cameras);
      }
      await wait(() => {
        return this.three.inited;
      });

      let all = cameras.map((x) => this.converter.element.to.camera(x));
      let datas = await Promise.all(all);
      this.three.camera.datas.set(datas);
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
    load: async () => {
      let map = await this.business.load();

      this.map.data.set(map);
      if (this.outputable) {
        this.maploaded.emit(map);
      }
      if (map) {
        let datas = this.three.model.datas();
        let village = this.converter.map.to.village(map);

        this.three.model.datas.set([...datas, village]);
      }
    },
  };

  floor = {
    model: signal<ModelFile | undefined>(undefined),
    datas: signal<GeoMapElement[]>([]),
    selected: signal<GeoMapElement | undefined>(undefined),
    target: new EventEmitter<{ id: string; visibility: Record<string, boolean> }>(),

    load: async (building: GeoMapElement, file: ModelFile) => {
      this.floor.model.set(file);
      let datas = await this.business.element.building.floor.load(building.Id);
      this.floor.datas.set(datas);
    },
    clear: () => {
      this.floor.model.set(undefined);
      this.floor.datas.set([]);
      this.floor.selected.set(undefined);
    },

    on: {
      select: (data: GeoMapElement) => {
        let model = this.floor.model();
        if (!model) return;
        this.floor.selected.set(data);
        let args = {
          id: model.name,
          visibility: Object.fromEntries(
            this.floor
              .datas()
              .map((item) => [item.ElementId, this.floor.selected()?.Id === item.Id]),
          ) as Record<string, boolean>,
        };
        console.log(args);
        this.floor.target.emit(args);

        this.element.load(data.Id);

        setTimeout(() => {
          this.three.focus.emit();
        }, 10);
      },
      back: async () => {
        this.outputable = false;
        this.floor.clear();
        this.three.model.clear();

        await Promise.all([this.map.load(), this.building.load(), this.element.load()]);

        this.outputable = true;
      },
    },
  };

  three = {
    inited: false,
    focus: new EventEmitter<FitView | void>(),
    model: {
      datas: signal<ModelViewerModel[]>([]),
      clear: () => {
        this.three.model.datas.set([]);
      },
    },
    camera: {
      datas: signal<MarkerEntity[]>([]),
    },

    on: {
      inited: () => {
        this.three.inited = true;
      },
      loaded: () => {
        setTimeout(() => {
          this.three.focus.emit();
        }, 10);
      },
      standby: {
        binding: (data: StandbyClickArgs) => {
          let parent: GeoMapElement | undefined;
          if (this.floor.model()) {
            let floor = this.floor.selected();
            if (!floor) {
              return;
            }
            parent = floor;
          }
          let args: BindingArgs = {
            location: { x: data.x, y: data.y, z: data.z },
            standby: data.data,
            parent: parent,
          };

          this.binding.emit(args);
        },
        cancel: () => {
          this.standbyCancel.emit();
        },
      },

      building: {
        select: (modelId: string) => {
          let building = this.building.get(modelId);
          console.log(building);
        },
        expand: async (modelId: string) => {
          let building = this.building.get(modelId);
          if (building) {
            let expansion = await this.business.model.get.expansion(modelId);
            if (expansion) {
              this.floor.load(building, expansion);
              let model = this.converter.model.from.file(expansion, building);
              model.position = { x: 0, y: 0, z: 0 };
              this.three.model.datas.set([model]);
            }
          }
        },
      },
    },
  };
}
