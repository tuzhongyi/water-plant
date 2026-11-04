import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  FitView,
  MarkerEntity,
  ModelFile,
  ModelViewerModel,
  MoveToArgs,
  RenderMode,
  ViewfieldMode,
} from '../../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionComponent } from '../../../../common/components/three-dimension/three-dimension.component';
import { MapElementType } from '../../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../../common/data-core/models/geographic/map.model';
import { ThreeDConfig } from '../../../../common/storage/three-d-storage/three-d-store.model';
import { HtmlTool } from '../../../../common/tools/html-tool/html.tool';
import { wait } from '../../../../common/tools/wait';
import { MapModel } from '../../../../setting/setting-map/business/setting-map.model';
import { SystemMainThreeBusiness } from '../business/system-main-three.business';
import { SystemMainThreeConverter } from '../business/system-main-three.converter';
import { SystemMainThreeArgs } from '../business/system-main-three.model';
import { SystemMainThreeConfigFindSliderComponent } from '../system-main-three-config/system-main-three-config-find-slider/system-main-three-config-find-slider.component';
import { SystemMainThreeElementManagerComponent } from '../system-main-three-element/system-main-three-element-manager/system-main-three-element-manager.component';
import { SystemMainThreeFilterComponent } from '../system-main-three-filter/system-main-three-filter.component';

@Component({
  selector: 'hw-system-main-three-container',
  imports: [
    CommonModule,
    ThreeDimensionComponent,
    SystemMainThreeConfigFindSliderComponent,
    SystemMainThreeFilterComponent,
    SystemMainThreeElementManagerComponent,
  ],
  templateUrl: './system-main-three-container.component.html',
  styleUrl: './system-main-three-container.component.less',
  providers: [SystemMainThreeBusiness, SystemMainThreeConverter],
})
export class SystemMainThreeContainerComponent implements OnInit, OnDestroy {
  @Input() args = new SystemMainThreeArgs();
  @Output() argsChange = new EventEmitter<SystemMainThreeArgs>();
  @Input('alarm') _alarm?: EventEmitter<string>;
  @Input() unalarm?: EventEmitter<GeoMapElement>;
  @Input() elementload?: EventEmitter<SystemMainThreeArgs>;
  @Output() maploaded = new EventEmitter<GeoMap>();
  @Output() buildingloaded = new EventEmitter<GeoMapElement[]>();
  @Output() buildingselect = new EventEmitter<GeoMapElement>();
  @Output() elementloaded = new EventEmitter<GeoMapElement[]>();
  @Input() load?: EventEmitter<void>;
  @Input() renderPaused = false;
  /**	右侧点位分组面板是否展开：展开时右下角按钮让到面板左侧 */
  @Input() panelExpanded = false;
  /**	点位分组面板里被隐藏的点位 Id：不渲染对应 marker */
  private _hiddenIds: ReadonlySet<string> = new Set<string>();
  @Input()
  get hiddenIds(): ReadonlySet<string> {
    return this._hiddenIds;
  }
  set hiddenIds(value: ReadonlySet<string>) {
    this._hiddenIds = value ?? new Set<string>();
    this.element.sync();
  }
  @Output() preview = new EventEmitter<GeoMapElement>();
  @Output() video = new EventEmitter<GeoMapElement[]>();
  @Output() found = new EventEmitter<GeoMapElement[]>();
  @Output() resetstate = new EventEmitter<GeoMapElement>();
  @Output() expandscreen = new EventEmitter<boolean>();
  @Output() fullscreen = new EventEmitter<boolean>();

  constructor(
    private business: SystemMainThreeBusiness,
    private converter: SystemMainThreeConverter,
  ) {}
  FitView = FitView;
  private subs = new Subscription();

  ngOnInit(): void {
    /*	渲染模式在创建模型前从本地缓存恢复，
        否则会先按默认模式加载一遍、再整体重载 */
    this.three.renderMode.set(this.business.config.renderMode);
    /*	是否显示绿植也同步读取：配置关闭时不要在场景初始化时先把树加载一遍 */
    this.three.model.treeconfig.set(this.business.config.tree);
    this.manager.fullscreen.value.set(HtmlTool.screen.get.fullscreen());
    document.addEventListener('fullscreenchange', this.manager.fullscreen.change);
    this.regist();
    this.init();
    this.map.load();
    this.building.load();
    this.element.load(this.args, false);
  }
  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.manager.fullscreen.change);
    this.subs.unsubscribe();
  }
  private init() {
    this.business.config.load().then((x) => {
      this.three.config.set(x);
      this.three.model.treeconfig.set(this.business.config.tree);
      this.element.find.circle.radius = x.find.radius;
    });
    this.business.element.get.alarms().then((elements) => {
      elements.forEach((x) => {
        if (x.ElementId) {
          this.alarm.to(x.ElementId);
        }
      });
    });
  }
  private regist() {
    if (this.load) {
      this.subs.add(
        this.load.subscribe((x) => {
          let floorId = this.floor.selected()?.Id;
          this.args.floorId = floorId;
          this.argsChange.emit(this.args);
          this.element.load(this.args, false);
        }),
      );
    }
    if (this.elementload) {
      this.subs.add(
        this.elementload.subscribe((x) => {
          this.args = x;

          /*	外部触发的重载（每分钟定时、报警事件）也要按当前展开状态取范围；
              否则和展开状态下的加载来回切换，房间内的点位会反复消失又出现 */
          this.element.load(this.loadArgs, x.usecache);
        }),
      );
    }
    if (this._alarm) {
      this.subs.add(
        this._alarm.subscribe((deviceId) => {
          this.alarm.to(deviceId);
        }),
      );
    }
    if (this.unalarm) {
      this.subs.add(
        this.unalarm.subscribe((element) => {
          this.business.element.alarm.unalarm(element.Id).then((building) => {
            if (building) {
              this.building.reload(building);

              let floors = this.floor.datas();
              if (floors.length > 0) {
                this.args.buildingId = building.Id;
                let floor = this.floor.selected();
                if (floor) {
                  this.args.floorId = floor.Id;
                }
              }
            }
            this.element.load(this.loadArgs, false);
          });
        }),
      );
    }
    this.subs.add(
      this.business.element.alarm.discard.subscribe((element) => {
        switch (element.ElementType) {
          case MapElementType.Building:
            this.building.reload(element);
            break;
          default:
            this.element.load(this.loadArgs, false);
            break;
        }
      }),
    );
    this.subs.add(
      this.business.config.change.subscribe((x) => {
        this.three.model.treeconfig.set(this.business.config.tree);
        this.element.find.circle.radius = x.find.radius;
      }),
    );
  }

  /**	当前视图的加载参数
      展开建筑/楼层后 args 可能已被空点击重置，这里按当前展开状态重建（保留筛选条件）；
      否则加载条件丢失（只剩无父级的点位），楼内 marker 会全部消失 */
  private get loadArgs(): SystemMainThreeArgs {
    let model = this.floor.model();
    if (!model) return this.args;

    let floor = this.floor.selected();
    let building = this.building.get(this.converter.model.from.expansion(model.name));
    if (!floor && !building) return this.args;

    let args = new SystemMainThreeArgs();
    args.name = this.args.name;
    args.type = this.args.type;
    args.floorId = floor?.Id;
    args.buildingId = floor ? undefined : building?.Id;
    return args;
  }

  alarm = {
    to: (deviceId: string) => {
      this.business.element.alarm.push(deviceId).then((elements) => {
        let building = elements.find((x) => x.ElementType == MapElementType.Building);
        /*	楼层视图里场景只有扩展模型：不重载建筑模型，只刷新当前楼层点位 */
        if (building && !this.floor.model()) {
          this.building.reload(building);
        } else {
          this.element.load(this.loadArgs, false);
        }
      });
    },
  };

  manager = {
    expand: false,
    fullscreen: {
      value: signal(false),
      change: () => {
        this.manager.fullscreen.value.set(HtmlTool.screen.get.fullscreen());
      },
    },
    filter: {
      show: false,
      clear: (reload: boolean) => {
        this.args = new SystemMainThreeArgs();
        this.argsChange.emit(this.args);
        if (reload) {
          this.element.load(this.args, true);
        }
      },
      doing: () => {
        /*	筛选条件之外还带着当前的展开范围，否则在楼层里筛选会跳到广场的点位 */
        this.element.load(this.loadArgs, true);
      },
      close: () => {
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
        if (this.element.find.circle.finding) {
          this.element.find.circle.stop.emit();
        }
        if (this.element.find.fan.finding) {
          this.element.find.fan.stop.emit();
        }
      },

      screen: {
        expand: () => {
          this.manager.expand = !this.manager.expand;
          this.expandscreen.emit(this.manager.expand);
        },
        full: () => {
          this.fullscreen.emit(!this.manager.fullscreen.value());
        },
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
            this.three.renderMode.set(RenderMode.overlay);
            break;
        }
        /* 记住用户的选择，刷新页面后沿用 */
        this.business.config.saveRenderMode(this.three.renderMode());
      },
      filter: () => {
        this.manager.filter.show = true;
      },
      view: (mode?: FitView) => {
        this.manager.button.clear();
        this.three.focus.emit(mode);
      },
      find: {
        circle: () => {
          if (this.element.find.circle.finding) {
            this.element.find.circle.stop.emit();
          } else {
            this.manager.button.clear();
            this.element.find.circle.found = [];
            this.element.find.circle.begin.emit(this.element.find.circle.radius);
            this.element.find.circle.finding = true;
          }
        },
        fan: () => {
          if (this.element.find.fan.finding) {
            this.element.find.fan.stop.emit();
          } else {
            this.manager.button.clear();
            this.element.find.fan.found = [];
            /* 进入扇形查找时打开摄像机视野，方便对照扇形范围 */
            this.element.viewfield = ViewfieldMode.show;
            this.element.find.fan.begin.emit();
            this.element.find.fan.finding = true;
          }
        },
      },
      viewfield: () => {
        if (this.element.viewfield == ViewfieldMode.hide) {
          this.element.viewfield = ViewfieldMode.show;
        } else {
          this.element.viewfield = ViewfieldMode.hide;
        }
      },
    },
    building: {
      show: false,
      select: (data: GeoMapElement) => {
        this.three.moveto.emit({ modelId: data.ElementId, zoomIn: true });
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
    selected: signal<GeoMapElement | undefined>(undefined),
    get: (modelId: string) => {
      let elements = this.building.datas();
      return elements.find((x) => x.ElementId == modelId);
    },
    reload: (data: GeoMapElement) => {
      /*	楼层视图里场景只有扩展模型：重载整栋建筑模型会把原始建筑塞回场景，
          楼层可见性也会被重置成全部楼层；楼层视图下不重载建筑，点位由调用方刷新 */
      if (this.floor.model()) return;
      let model = this.converter.element.to.building(data, this.three.renderMode());
      this.three.model.reload.emit(model);
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
    /**	最近一次生成的全部 marker（未过滤隐藏），hiddenIds 变化时据此重新过滤 */
    markers: [] as MarkerEntity[],
    /**	加载版本：并发加载（展开建筑/选楼层/定时刷新）时只让最后发起的结果落地 */
    version: 0,

    viewfield: ViewfieldMode.hide,
    ViewfieldMode: ViewfieldMode,
    find: {
      circle: {
        finding: false,
        found: [] as GeoMapElement[],
        radius: 20,
        begin: new EventEmitter<number>(),
        stop: new EventEmitter<void>(),
        end: (datas: MarkerEntity[]) => {
          this.element.find.circle.found = datas.map((x) => x.data);
          this.element.find.circle.finding = false;
        },
      },
      fan: {
        finding: false,
        found: [] as GeoMapElement[],
        begin: new EventEmitter<void>(),
        stop: new EventEmitter<void>(),
        end: (datas: MarkerEntity[]) => {
          this.element.find.fan.found = datas.map((x) => x.data);
          this.element.find.fan.finding = false;
          /* 退出扇形查找时隐藏摄像机视野 */
          this.element.viewfield = ViewfieldMode.hide;
        },
      },
    },
    get: (modelId: string) => {
      let elements = this.element.datas();
      return elements.find((x) => x.ElementId == modelId);
    },
    /**	按 hiddenIds 过滤后写入 3D 组件的 marker 列表（被隐藏的点位不渲染） */
    sync: () => {
      let hidden = this.hiddenIds;
      this.three.camera.datas.set(
        hidden.size > 0
          ? this.element.markers.filter((x) => !hidden.has(x.id))
          : this.element.markers,
      );
    },
    load: async (args: SystemMainThreeArgs, usecache: boolean) => {
      let version = ++this.element.version;
      let elements = await this.business.element.load(args, usecache);
      /*	期间又发起了新的加载（展开建筑/选楼层/定时刷新），旧结果直接丢弃：
          否则旧的整栋楼范围后到，会把已选楼层的点位覆盖回来 */
      if (version != this.element.version) return;

      this.element.datas.set(elements);

      this.elementloaded.emit(elements);

      await wait(() => {
        return this.three.inited;
      });

      let all = elements.map((x) => this.converter.element.to.marker(x));
      let markers = await Promise.all(all);
      if (version != this.element.version) return;

      this.element.markers = markers;
      this.element.sync();
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
      this.three.model.tree.set(false);
    },
    clear: () => {
      this.floor.model.set(undefined);
      this.floor.datas.set([]);
      this.floor.selected.set(undefined);
      this.three.model.tree.set(true);
    },

    on: {
      select: async (data: GeoMapElement) => {
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

        this.floor.target.emit(args);

        this.args.floorId = data.Id;
        this.args.buildingId = undefined;
        this.argsChange.emit(this.args);
        await this.element.load(this.args, true);
        this.three.moveto.emit({ modelId: model.name, meshId: data.ElementId });
        // setTimeout(() => {
        //   // this.three.focus.emit();

        // }, 10);
      },
      back: async () => {
        this.manager.filter.clear(false);
        this.floor.clear();
        this.three.model.clear();

        await Promise.all([
          this.map.load(),
          this.building.load(),
          this.element.load(this.args, true),
        ]);
      },
    },
  };

  three = {
    inited: false,
    loading: signal(false),
    focus: new EventEmitter<FitView | void>(),
    moveto: new EventEmitter<MoveToArgs>(),
    renderMode: signal<RenderMode>(RenderMode.solid),
    config: signal<ThreeDConfig | undefined>(undefined),
    model: {
      /** 当前视图是否显示树：进入楼层内部时关闭，返回后恢复 */
      tree: signal(true),
      /** 配置「显示绿植」：关闭后 solid 模式也不加载树 */
      treeconfig: signal(true),
      datas: signal<ModelViewerModel[]>([]),
      reload: new EventEmitter<ModelViewerModel>(),
      clear: () => {
        this.three.model.datas.set([]);
        this.buildingselect.emit();
      },
    },
    /**	是否加载场景中的树：树只在 solid（实体）模式下有意义；
        配置关闭绿植或进入楼层内部（model.tree=false）时都不加载 */
    get trees(): boolean {
      return this.renderMode() == RenderMode.solid && this.model.treeconfig() && this.model.tree();
    },
    camera: {
      datas: signal<MarkerEntity[]>([]),
    },

    on: {
      inited: () => {
        this.three.inited = true;
      },
      /** 3D 组件加载状态：场景未就绪/模型加载中为 true，由 3D 组件内部驱动 */
      loading: (value: boolean) => {
        this.three.loading.set(value);
      },
      loaded: () => {
        this.three.focus.emit();
      },
      building: {
        select: (modelId: string) => {
          let building = this.building.get(modelId);
          this.building.selected.set(building);
          this.buildingselect.emit(building);
        },
        expand: async (modelId: string) => {
          let building = this.building.get(modelId);
          if (building) {
            let expansion = await this.business.model.expansion(this.three.renderMode(), modelId);
            if (expansion) {
              this.floor.load(building, expansion);
              this.args.buildingId = building.Id;
              this.argsChange.emit(this.args);
              // 先加载元素（标记），确保标记就绪后再加载模型
              await this.element.load(this.args, true);
              let model = this.converter.model.from.file(
                expansion,
                building,
                this.three.renderMode(),
              );
              model.position = { x: 0, y: 0, z: 0 };
              this.three.model.datas.set([model]);
            }
          }
        },
      },
      camera: {
        dblclick: (id: string) => {
          let element = this.element.datas().find((x) => x.Id == id);
          if (element) {
            switch (element.ElementType) {
              case MapElementType.Camera:
                this.preview.emit(element);
                break;
              case MapElementType.Announciator:
              case MapElementType.Entrance:
              case MapElementType.IoTSensor:
              case MapElementType.Door:
                this.resetstate.emit(element);
                break;
              default:
                break;
            }
          }
        },
      },
    },
  };
}
