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
  /**	点位分组面板的定位事件：聚焦到指定点位（可能要先展开所在建筑/楼层） */
  @Input() locate?: EventEmitter<GeoMapElement>;
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
  /**	展开版本：返回总览 / 再次展开时递增，用来丢弃过期的展开流程
      （楼层列表、整栋楼点位都是异步的，期间用户可能已经返回或换了建筑） */
  private expandVersion = 0;

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
    if (this.locate) {
      this.subs.add(
        this.locate.subscribe((x) => {
          this.element.locate.do(x);
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
    /* 没展开建筑：沿用 args（广场/全场景） */
    let model = this.floor.model();
    if (!model) return this.args;

    let args = new SystemMainThreeArgs();
    args.name = this.args.name;
    args.type = this.args.type;

    /* 已选楼层：楼层范围 */
    let floor = this.floor.selected();
    if (floor) {
      args.floorId = floor.Id;
      return args;
    }

    /*	展开建筑、未选楼层：整栋楼范围。
        building 直接用展开时记下的对象，不再从模型文件名反推：
        反推失败会退回可能已被空点击重置的 args，定时刷新就会把楼内点位当成
        广场点位加载，marker 全部消失、下一次请求又出现 */
    let building = this.floor.building();
    if (!building) return this.args;
    args.buildingId = building.Id;
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
          /*	打开建筑列表时作废还在途中的展开（楼层列表可能还没回来），
              否则列表打开后又被自动带进楼里 */
          this.expandVersion++;
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
    is: {
      expand: () => {},
    },
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

      /*	等待期间已经展开建筑：场景里只能有扩展模型，
          不能把广场/建筑模型塞回去（否则建筑模型和扩展模型同时出现） */
      if (this.floor.model()) return;

      let datas = this.three.model.datas();
      let models = buildings.map((x) => {
        return this.converter.element.to.building(x, this.three.renderMode());
      });
      this.three.model.datas.set([...datas, ...models]);
    },
  };
  element = {
    datas: signal<GeoMapElement[]>([]),
    select: new EventEmitter<string>(),
    /**	最近一次生成的全部 marker（未过滤隐藏），hiddenIds 变化时据此重新过滤 */
    markers: [] as MarkerEntity[],
    /**	加载版本：并发加载（展开建筑/选楼层/定时刷新）时只让最后发起的结果落地 */
    version: 0,
    /**	上一次落地结果的范围与数量：用来识别「同一个范围突然返回空」的瞬时异常
        （定时/报警刷新时服务端偶发返回空，会让整片点位先消失、下一次刷新再出现） */
    scope: {
      key: '',
      count: 0,
      empties: 0,
      /** 加载范围标识：范围没变时 key 相同（名称/类型筛选也算范围） */
      keyOf: (args: SystemMainThreeArgs): string =>
        [args.buildingId ?? '', args.floorId ?? '', args.name ?? '', args.type ?? ''].join('|'),
    },
    loading: false,
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
    /**	@param floors 已取到的楼层列表（展开建筑时传，省掉一次重复请求） */
    load: async (args: SystemMainThreeArgs, usecache: boolean, floors?: GeoMapElement[]) => {
      this.element.loading = true;
      let version = ++this.element.version;
      try {
        let elements = await this.business.element.load(args, usecache, floors);
        /*	期间又发起了新的加载（展开建筑/选楼层/定时刷新），旧结果直接丢弃：
            否则旧的整栋楼范围后到，会把已选楼层的点位覆盖回来 */
        if (version != this.element.version) return;

        /*	同一范围突然返回空：当成服务端瞬时异常，先沿用原有点位等下一次刷新；
            连续两次都是空才认为是真的没有点位，避免整片点位短暂消失再出现 */
        let key = this.element.scope.keyOf(args);
        let scope = this.element.scope;
        if (elements.length == 0 && scope.key == key && scope.count > 0) {
          if (scope.empties == 0) {
            scope.empties++;
            this.element.loading = false;
            console.warn('[system-main-three] 当前范围返回空点位，保留已有点位，等待下一次刷新', args);
            return;
          }
        }
        this.element.datas.set(elements);

        this.elementloaded.emit(elements);

        await wait(() => {
          return this.three.inited;
        });

        /*	单个点位的转换要查楼栋/设备状态，其中一个失败（并发请求、网络抖动、
            设备重复绑定抛错）不能把整批标记都丢掉：失败的点位沿用上一次的 marker，
            其余照常刷新，避免点位整片消失等下一次刷新再出现 */
        let previous = new Map(this.element.markers.map((x) => [x.id, x]));
        let all = elements.map((x) => this.converter.element.to.marker(x));
        let results = await Promise.all(all.map((x) => x.catch(() => undefined)));
        if (version != this.element.version) return;

        this.element.markers = results
          .map((marker, index) => marker ?? previous.get(elements[index].Id))
          .filter((x): x is MarkerEntity => !!x);
        this.element.sync();

        /* 记录这次「实际落地」的范围与数量，供下一次空结果判断 */
        scope.key = key;
        scope.count = elements.length;
        scope.empties = 0;
      } catch (error) {
        /*	加载失败时保留上一次的点位，等下一次定时/报警刷新；
            同时把 loading 复位，否则依靠它等待的定位流程会一直卡住 */
        if (version == this.element.version) {
          this.element.loading = false;
        }
        console.error('[system-main-three] 加载点位失败，保留已有点位', error);
      }
    },
    visible: (data: GeoMapElement) => {
      let marker = this.three.camera.datas().find((x) => x.id == data.Id);
      if (!marker) return false;
      return this.three.model.datas().some((x) => x.fileName == marker.modelId);
    },
    on: {
      loaded: () => {
        this.element.loading = false;
      },
    },
    locate: {
      data: undefined as GeoMapElement | undefined,
      doing: false,
      do: async (element: GeoMapElement) => {
        this.element.locate.doing = true;
        this.element.locate.data = element;
        /* 已加载不等于已在场景中：展开建筑后，不属于该建筑的 marker 会被移出场景，
               直接选中不会聚焦，要落到下面的展开 / 返回总览流程 */
        if (this.element.visible(element)) {
          this.element.select.emit(element.Id);
          this.element.locate.doing = false;
          this.element.locate.data = undefined;
          return;
        }
        if (element.ParentId) {
          let floor = await this.business.element.get.by.id(element.ParentId);
          if (floor.ParentId) {
            let building = await this.business.element.get.by.id(floor.ParentId);
            if (building.ElementId) {
              /*	已经在同一栋楼里：不必再展开一次（展开会先把整栋楼的点位刷一遍，
                  别的楼层的点位会短暂出现再消失），直接选楼层 */
              if (this.floor.building()?.Id !== building.Id) {
                await this.three.on.building.expand(building.ElementId);
              }
              if (this.floor.model()) {
                await this.floor.on.select(floor);
              }

              wait(() => {
                return this.three.loading() == false && this.element.loading == false;
              }).then((x) => {
                this.element.select.emit(element.Id);
              });
            }
          }
        } else {
          this.floor.on.back().then((x) => {
            setTimeout(() => {
              wait(() => {
                return this.three.loading() == false && this.element.loading == false;
              }).then((x) => {
                this.element.select.emit(element.Id);
              });
            }, 10);
          });
        }
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
    load: async () => {
      let map = await this.business.map.load();

      this.map.data.set(map);

      this.maploaded.emit(map);

      /*	请求期间已经展开建筑：场景里只能有扩展模型，不要再把广场塞回去 */
      if (map && !this.floor.model()) {
        let datas = this.three.model.datas();
        let village = this.converter.map.to.village(map, this.three.renderMode());

        this.three.model.datas.set([...datas, village]);
      }
    },
  };

  floor = {
    model: signal<ModelFile | undefined>(undefined),
    /**	展开时记下所在建筑：loadArgs 用它确定范围，不再从模型文件名反推 */
    building: signal<GeoMapElement | undefined>(undefined),
    datas: signal<GeoMapElement[]>([]),
    selected: signal<GeoMapElement | undefined>(undefined),
    target: new EventEmitter<{ id: string; visibility: Record<string, boolean> }>(),
    is: {
      selected: (): boolean => {
        return !!this.floor.selected();
      },
    },
    load: async (building: GeoMapElement, file: ModelFile, version: number) => {
      /*	先取楼层列表再改状态：请求失败时保持原状，不会出现「floor.model 已切到新建筑、
          模型还停在原场景」的半进入状态（此时 loadArgs 会按新建筑加载点位，
          而场景里没有对应模型，点位会全部被判为不可见） */
      let datas = await this.business.element.building.floor.load(building.Id);
      /*	期间用户已返回总览 / 又展开了别的建筑：这次结果不能再改状态，
          否则会把已经清掉的展开状态又设回来 */
      if (version != this.expandVersion) return;

      /* 换了建筑：上一次选中的楼层不再有效，否则并发刷新会按旧楼层范围加载 */
      if (this.floor.building()?.Id !== building.Id) {
        this.floor.selected.set(undefined);
      }

      this.floor.model.set(file);
      this.floor.building.set(building);
      this.floor.datas.set(datas);
      /*	唯一楼层的自动选中放到 expand 的模型加载之后（见 three.on.building.expand）：
          在这里选中会再发起一次楼层范围的加载，和展开的整栋楼加载并发，
          两份不同范围的结果互相覆盖，点位会消失后再出现 */
      this.three.model.tree.set(false);
    },
    clear: () => {
      this.floor.model.set(undefined);
      this.floor.building.set(undefined);
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
        /* 作废还在进行中的展开（楼层/点位还在请求时用户就点了返回） */
        this.expandVersion++;
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
    lensmoving: false,
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
        setTimeout(() => {
          this.three.focus.emit();
        }, 0);
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
            let version = ++this.expandVersion;
            let expansion = await this.business.model.expansion(this.three.renderMode(), modelId);
            if (expansion && version == this.expandVersion) {
              /*	先把楼层列表取好（不等它自己选层），避免楼层范围内的加载
                  和下面整栋楼的加载并发、互相覆盖 */
              try {
                await this.floor.load(building, expansion, version);
              } catch (error) {
                /* 楼层都取不到，展开后也加载不到楼内点位：保持原状，等下次操作重试 */
                console.error('[system-main-three] 加载楼层失败，取消展开', error);
                return;
              }
              /*	期间用户点了返回、或又展开了别的建筑：这次展开作废 */
              if (version != this.expandVersion) return;

              this.args.floorId = undefined;
              this.args.buildingId = building.Id;
              this.argsChange.emit(this.args);
              /*	先加载元素（标记），确保标记就绪后再加载模型；
                  楼层列表已经取过，直接传进去，不再让 business 重复请求一次 */
              await this.element.load(this.args, true, this.floor.datas());
              if (version != this.expandVersion) return;

              let model = this.converter.model.from.file(
                expansion,
                building,
                this.three.renderMode(),
              );
              model.position = { x: 0, y: 0, z: 0 };
              this.three.model.datas.set([model]);
              /*	只有一层时自动选中：此时模型和整栋楼点位都已就绪，
                  楼层范围的加载不会再和展开的加载竞争 */
              let datas = this.floor.datas();
              if (datas.length == 1 && this.floor.selected()?.Id !== datas[0].Id) {
                this.floor.on.select(datas[0]);
              }
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
