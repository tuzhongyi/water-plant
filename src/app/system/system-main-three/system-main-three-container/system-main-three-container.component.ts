import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  FitView,
  MarkerEntity,
  ModelFile,
  ModelViewerModel,
  RenderMode,
  StandbyClickArgs,
} from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionComponent } from '../../../common/components/three-dimension/three-dimension.component';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { IIdNameModel } from '../../../common/data-core/models/interface/model.interface';
import { wait } from '../../../common/tools/wait';
import { BindingArgs, MapModel } from '../../../setting/setting-map/business/setting-map.model';
import { SystemMainThreeBusiness } from '../business/system-main-three.business';
import { SystemMainThreeConverter } from '../business/system-main-three.converter';

@Component({
  selector: 'hw-system-main-three-container',
  imports: [CommonModule, ThreeDimensionComponent],
  templateUrl: './system-main-three-container.component.html',
  styleUrl: './system-main-three-container.component.less',
  providers: [SystemMainThreeBusiness, SystemMainThreeConverter],
})
export class SystemMainThreeContainerComponent implements OnInit, OnDestroy {
  @Input() focusCameraId?: IIdNameModel;
  @Output() maploaded = new EventEmitter<GeoMap>();

  @Output() buildingloaded = new EventEmitter<GeoMapElement[]>();
  @Output() buildingselect = new EventEmitter<GeoMapElement>();

  @Output() cameraloaded = new EventEmitter<GeoMapElement[]>();
  @Output() binding = new EventEmitter<BindingArgs>();
  @Output() standbyCancel = new EventEmitter<void>();
  @Input() load?: EventEmitter<void>;
  @Output() preview = new EventEmitter<GeoMapElement>();
  constructor(
    private business: SystemMainThreeBusiness,
    private converter: SystemMainThreeConverter,
  ) {}
  FitView = FitView;
  private subs = new Subscription();
  outputable = true;

  ngOnInit(): void {
    this.map.load();
    this.building.load();
    this.element.load();
    this.regist();
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

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

  manager = {
    on: {
      click: () => {
        this.manager.button.clear();
      },
    },
    button: {
      clear: () => {
        this.manager.building.show = false;
      },
      building: () => {
        if (this.floor.model()) {
          this.floor.on.back();
        } else {
          this.manager.building.show = !this.manager.building.show;
        }
      },
      mode: () => {
        this.manager.button.clear();
        switch (this.three.renderMode()) {
          case RenderMode.overlay:
            this.three.renderMode.set(RenderMode.solid);
            break;
          case RenderMode.solid:
            this.three.renderMode.set(RenderMode.overlay);
            break;

          default:
            break;
        }
      },
      filter: () => {
        this.manager.button.clear();
      },
      view: (mode?: FitView) => {
        this.manager.button.clear();
        this.three.focus.emit(mode);
      },
    },
    building: {
      show: false,
      select: (data: GeoMapElement) => {
        if (data.ElementId) {
          this.manager.building.show = false;
          this.three.on.building.expand(data.ElementId);
        }
      },
    },
  };
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
    datas: signal<GeoMapElement[]>([]),
    get: (modelId: string) => {
      let elements = this.element.datas();
      return elements.find((x) => x.ElementId == modelId);
    },
    load: async (floorId?: string) => {
      let cameras = await this.business.element.load(floorId);

      this.element.datas.set(cameras);
      if (this.outputable) {
        this.cameraloaded.emit(cameras);
      }
      await wait(() => {
        return this.three.inited;
      });

      let all = cameras.map((x) => this.converter.element.to.marker(x));
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
      let map = await this.business.map.load();

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
    renderMode: signal<RenderMode>(RenderMode.overlay),
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
        },
        expand: async (modelId: string) => {
          let building = this.building.get(modelId);
          if (building) {
            let expansion = await this.business.model.expansion(modelId);
            if (expansion) {
              this.floor.load(building, expansion);
              let model = this.converter.model.from.file(expansion, building);
              model.position = { x: 0, y: 0, z: 0 };
              this.three.model.datas.set([model]);
            }
          }
        },
      },
      camera: {
        dblclick: (id: string) => {
          console.log(id);
          let camera = this.element.datas().find((x) => x.Id == id);
          this.preview.emit(camera);
        },
      },
    },
  };
}
