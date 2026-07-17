import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  FitView,
  MarkerEntity,
  ModelFile,
  ModelViewerModel,
  RenderMode,
} from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionComponent } from '../../../common/components/three-dimension/three-dimension.component';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { wait } from '../../../common/tools/wait';
import { MapModel } from '../../../setting/setting-map/business/setting-map.model';
import { SystemMainThreeBusiness } from '../business/system-main-three.business';
import { SystemMainThreeConverter } from '../business/system-main-three.converter';
import { SystemMainThreeArgs } from '../business/system-main-three.model';
import { SystemMainThreeElementManagerComponent } from '../system-main-three-element/system-main-three-element-manager/system-main-three-element-manager.component';
import { SystemMainThreeFilterComponent } from '../system-main-three-filter/system-main-three-filter.component';

@Component({
  selector: 'hw-system-main-three-container',
  imports: [
    CommonModule,
    ThreeDimensionComponent,
    SystemMainThreeFilterComponent,
    SystemMainThreeElementManagerComponent,
  ],
  templateUrl: './system-main-three-container.component.html',
  styleUrl: './system-main-three-container.component.less',
  providers: [SystemMainThreeBusiness, SystemMainThreeConverter],
})
export class SystemMainThreeContainerComponent implements OnInit, OnDestroy {
  @Input() elementload?: EventEmitter<SystemMainThreeArgs>;
  @Output() maploaded = new EventEmitter<GeoMap>();
  @Output() buildingloaded = new EventEmitter<GeoMapElement[]>();
  @Output() buildingselect = new EventEmitter<GeoMapElement>();
  @Output() elementloaded = new EventEmitter<GeoMapElement[]>();
  @Input() load?: EventEmitter<void>;
  @Output() preview = new EventEmitter<GeoMapElement>();
  @Output() video = new EventEmitter<GeoMapElement[]>();
  @Output() found = new EventEmitter<GeoMapElement[]>();
  constructor(
    private business: SystemMainThreeBusiness,
    private converter: SystemMainThreeConverter,
  ) {}
  FitView = FitView;
  private subs = new Subscription();

  ngOnInit(): void {
    this.map.load();
    this.building.load();
    this.element.load(this.manager.filter.args);
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
          this.manager.filter.args.floorId = floorId;
          this.element.load(this.manager.filter.args);
        }),
      );
    }
    if (this.elementload) {
      this.subs.add(
        this.elementload.subscribe((x) => {
          this.manager.filter.args = x;
          this.element.load(this.manager.filter.args);
        }),
      );
    }
  }

  manager = {
    filter: {
      args: new SystemMainThreeArgs(),
      show: false,
      clear: (reload: boolean) => {
        this.manager.filter.args = new SystemMainThreeArgs();
        if (reload) {
          this.element.load(this.manager.filter.args);
        }
      },
      doing: () => {
        this.element.load(this.manager.filter.args);
      },
      close: () => {
        this.manager.filter.clear(true);
        this.manager.filter.show = false;
      },
    },
    on: {
      click: () => {
        this.manager.button.clear();
      },
      video: (datas: GeoMapElement[]) => {
        this.video.emit(datas);
      },
      preview: (data: GeoMapElement) => {
        this.preview.emit(data);
      },
    },
    button: {
      clear: () => {
        this.manager.building.show = false;
        this.manager.filter.show = false;
        this.manager.filter.clear(false);
        if (this.element.find.finding) {
          this.element.find.stop.emit();
        }
        if (this.element.find.finding) {
          this.element.find.stop.emit();
          this.element.find.found = [];
        }
      },
      building: () => {
        this.manager.button.clear();
        if (this.floor.model()) {
          this.floor.on.back();
        } else {
          this.manager.building.show = true;
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
        this.manager.filter.show = true;
      },
      view: (mode?: FitView) => {
        this.manager.button.clear();
        this.three.focus.emit(mode);
      },
      find: async () => {
        this.manager.button.clear();
        if (this.element.find.finding) {
          this.element.find.stop.emit();
        } else {
          this.element.find.found = [];
          let radius = await this.business.map.radius.get();
          this.element.find.begin.emit(radius);
          this.element.find.finding = true;
        }
      },
    },
    building: {
      show: false,
      select: (data: GeoMapElement) => {
        this.building.moveto.emit(data.ElementId);
      },
      expand: (data: GeoMapElement) => {
        if (data.ElementId) {
          this.manager.building.show = false;
          this.three.on.building.expand(data.ElementId);
        }
      },
    },
  };
  building = {
    datas: signal<GeoMapElement[]>([]),
    moveto: new EventEmitter<string>(),
    get: (modelId: string) => {
      let elements = this.building.datas();
      return elements.find((x) => x.ElementId == modelId);
    },
    load: async () => {
      let buildings = await this.business.element.building.load();
      this.building.datas.set(buildings);

      this.buildingloaded.emit(buildings);

      await wait(() => {
        return this.three.inited;
      });

      let datas = this.three.model.datas();
      let models = buildings.map((x) => {
        return this.converter.element.to.building(x, this.three.renderMode());
      });
      this.three.model.datas.set([...datas, ...models]);
    },
  };
  element = {
    datas: signal<GeoMapElement[]>([]),
    find: {
      finding: false,
      found: [] as GeoMapElement[],
      begin: new EventEmitter<number>(),
      stop: new EventEmitter<void>(),
      end: (datas: MarkerEntity[]) => {
        this.element.find.found = datas.map((x) => x.data);
        this.element.find.finding = false;
      },
    },
    get: (modelId: string) => {
      let elements = this.element.datas();
      return elements.find((x) => x.ElementId == modelId);
    },
    load: async (args: SystemMainThreeArgs) => {
      let cameras = await this.business.element.load(args);

      this.element.datas.set(cameras);

      this.elementloaded.emit(cameras);

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

      this.maploaded.emit(map);

      if (map) {
        let datas = this.three.model.datas();
        let village = this.converter.map.to.village(map, this.three.renderMode());

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
      if (datas.length == 1) {
        this.floor.on.select(datas[0]);
      }
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

        this.manager.filter.args.floorId = data.Id;
        this.manager.filter.args.buildingId = undefined;
        this.element.load(this.manager.filter.args);

        setTimeout(() => {
          this.three.focus.emit();
        }, 10);
      },
      back: async () => {
        this.manager.filter.clear(false);
        this.floor.clear();
        this.three.model.clear();

        await Promise.all([
          this.map.load(),
          this.building.load(),
          this.element.load(this.manager.filter.args),
        ]);
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

      building: {
        select: (modelId: string) => {
          let building = this.building.get(modelId);
        },
        expand: async (modelId: string) => {
          let building = this.building.get(modelId);
          if (building) {
            let expansion = await this.business.model.expansion(this.three.renderMode(), modelId);
            if (expansion) {
              this.floor.load(building, expansion);
              let model = this.converter.model.from.file(
                expansion,
                building,
                this.three.renderMode(),
              );
              model.position = { x: 0, y: 0, z: 0 };
              this.three.model.datas.set([model]);
              this.manager.filter.args.buildingId = building.Id;
              this.element.load(this.manager.filter.args);
            }
          }
        },
      },
      camera: {
        dblclick: (id: string) => {
          console.log(id);
          let camera = this.element.datas().find((x) => x.Id == id);
          if (camera && camera.ElementType == MapElementType.Camera) {
            this.preview.emit(camera);
          }
        },
      },
    },
  };
}
