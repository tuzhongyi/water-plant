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
import {
  FitView,
  MarkerArgs,
  MarkerEntity,
  MarkerViewfieldArgs,
  ModelFile,
  ModelTransformConfig,
  ModelViewerModel,
  MoveToArgs,
  RenderMode,
  StandbyClickArgs,
  ViewfieldMode,
} from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionComponent } from '../../../common/components/three-dimension/three-dimension.component';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { IIdNameModel } from '../../../common/data-core/models/interface/model.interface';
import { wait } from '../../../common/tools/wait';
import { SettingMapBusiness } from '../business/setting-map.business';
import { BindingArgs, MapModel } from '../business/setting-map.model';
import { SettingMapThreeConverter } from './setting-map-three.converter';

@Component({
  selector: 'hw-setting-map-three',
  imports: [CommonModule, ThreeDimensionComponent],
  templateUrl: './setting-map-three.component.html',
  styleUrl: './setting-map-three.component.less',
  providers: [SettingMapBusiness, SettingMapThreeConverter],
})
export class SettingMapThreeComponent implements OnChanges, OnInit, OnDestroy {
  /** 输入：standby 待绑定点位（点位绑定模式下外部传入的选中对象），用于确定绑定目标 */
  @Input() standby?: IIdNameModel;
  /** 输入：需要定位/聚焦的摄像机 ID，变化时自动定位并选中该摄像机 */
  @Input() focusCameraId?: IIdNameModel;
  /** 输出：地图加载完成后触发，携带加载到的地图对象 */
  @Output() maploaded = new EventEmitter<GeoMap>();

  /** 输出：建筑列表加载完成后触发，携带建筑元素列表 */
  @Output() buildingloaded = new EventEmitter<GeoMapElement[]>();
  /** 输出：建筑被选中时触发（预留） */
  @Output() buildingselect = new EventEmitter<GeoMapElement>();

  /** 输出：摄像机元素加载完成后触发，携带摄像机元素列表 */
  @Output() elementloaded = new EventEmitter<GeoMapElement[]>();
  /** 输出：standby 点位绑定时触发，携带绑定参数（位置、父级等） */
  @Output() binding = new EventEmitter<BindingArgs>();
  /** 输出：取消 standby 绑定时触发 */
  @Output() standbyCancel = new EventEmitter<void>();
  /** 输入：外部触发重新加载当前楼层摄像机的信号 */
  @Input() load?: EventEmitter<void>;
  @Output() viewfield = new EventEmitter<MarkerViewfieldArgs>();

  /**
   * 构造器
   * @param business 业务逻辑服务，负责地图/建筑/元素/模型的数据加载与创建
   * @param converter 数据转换器，负责业务数据与 3D 组件数据之间的互转
   * @param toastr 全局提示消息服务
   */
  constructor(
    private business: SettingMapBusiness,
    private converter: SettingMapThreeConverter,
    private toastr: ToastrService,
  ) {}
  ViewfieldMode = ViewfieldMode;
  /** 订阅集合，统一管理所有 RxJS 订阅，便于销毁时一次性取消 */
  private subs = new Subscription();
  /** 是否允许对外输出事件；初始化/返回重载阶段置 false，避免中间态重复 emit */
  outputable = true;

  /**
   * 输入属性变化时触发
   * @param changes 输入属性变化集合
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.change.standby(changes['standby']);
    this.change.focus.camera(changes['focusCameraId']);
  }

  /** 组件初始化：加载地图、建筑、元素并注册外部 load 事件 */
  ngOnInit(): void {
    this.map.load();
    this.building.load();
    this.element.load();
    this.regist();
  }

  /** 组件销毁：取消所有订阅，防止内存泄漏 */
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** 输入变化处理集合 */
  private change = {
    /**
     * standby 输入变化处理：将外部传入的 standby 数据转换为 marker 参数并写入 3D 组件
     * @param change 输入属性变化
     */
    standby: async (change: SimpleChange) => {
      if (change) {
        if (this.standby) {
          let entity = await this.converter.args.from.data(this.standby);
          this.element.standby.set(entity);
        } else {
          this.element.standby.set(undefined);
        }
      }
    },
    focus: {
      /**
       * focusCameraId 输入变化处理：定位到目标摄像机并选中；
       * 若摄像机不在已加载数据中，则按父级链自动展开建筑/楼层后再选中
       * @param change 输入属性变化
       */
      camera: async (change: SimpleChange) => {
        if (change) {
          if (this.focusCameraId) {
            let elementId = this.focusCameraId.Id;
            let element = this.element.datas().find((x) => x.Id == elementId);
            if (element) {
              this.element.select.emit(elementId);
              return;
            }

            element = await this.business.element.get(elementId);
            if (element.ParentId) {
              let floor = await this.business.element.get(element.ParentId);
              if (floor.ParentId) {
                let building = await this.business.element.get(floor.ParentId);
                if (building.ElementId) {
                  await this.three.on.building.expand(building.ElementId);
                  await this.floor.on.select(floor);

                  wait(() => {
                    return this.three.loading == false && this.element.loading == false;
                  }).then((x) => {
                    this.element.select.emit(elementId);
                  });
                }
              }
            } else {
              this.floor.on.back().then((x) => {
                wait(() => {
                  return this.three.loading == false && this.element.loading == false;
                }).then((x) => {
                  this.element.select.emit(elementId);
                });
              });
            }
          }
        }
      },
    },
  };

  /**
   * 注册外部 load 事件：收到信号后重新加载当前选中楼层的摄像机元素
   */
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

  /**
   * 初始化地图：将数据库中的建筑/楼层与 3D 模型配置同步，
   * 缺失的建筑或楼层自动创建，并提示刷新
   * @param map 地图对象
   */
  async init(map: GeoMap) {
    let changed = false;
    let models = await this.business.model.load();
    let buildings = await this.business.element.building.load();
    let model = {
      buildings: models.filter((x) => x.type == 'building'),
      expansions: models.filter((x) => x.type == 'floors'),
    };
    for (let i = 0; i < model.buildings.length; i++) {
      const item = model.buildings[i];

      let building = buildings.find((x) => x.ElementId == item.name);
      let expansion = model.expansions.find(
        (x) => x.name == this.converter.model.to.expansion(item.name),
      );
      if (!building) {
        let args = {
          mapId: map.Id,
          modelId: item.name,
          name: item.config?.label ?? item.name,
          expansion: expansion?.name,
          location: item.config?.position,
        };
        building = await this.business.element.building.create(args);
        changed = true;
      }

      if (expansion) {
        let floors = await this.business.element.building.floor.load(building.Id);
        if (floors.length == 0 && expansion.config) {
          for (const key in expansion.config.meshVisibility) {
            let args = {
              meshname: key,
              modelId: expansion.name,
              buildingId: building.Id,
              mapId: map.Id,
              location: item.config?.position,
            };
            await this.business.element.building.floor.create(args);
            changed = true;
          }
        }
      }
    }
    if (changed) {
      this.toastr.success('初始化完成，请刷新界面');
    }
  }

  /** 建筑相关状态与操作集合 */
  building = {
    /** 建筑元素列表（响应式信号） */
    datas: signal<GeoMapElement[]>([]),
    /**
     * 按模型 ID 查找建筑元素
     * @param modelId 模型 ID（对应建筑 ElementId）
     * @returns 匹配的建筑元素，未找到返回 undefined
     */
    get: (modelId: string) => {
      let elements = this.building.datas();
      return elements.find((x) => x.ElementId == modelId);
    },
    /**
     * 加载建筑列表：过滤出建筑类型元素，输出列表并转换为 3D 建筑模型
     */
    load: async () => {
      let buildings = await this.business.element.building.load();
      buildings = buildings.filter((x) => x.ElementType === MapElementType.Building);
      this.building.datas.set(buildings);
      if (this.outputable) {
        this.buildingloaded.emit(buildings);
      }

      await wait(() => {
        return this.three.inited;
      });

      let datas = this.three.model.datas();
      let models = buildings.map((x) => {
        return this.converter.element.to.building(x, this.three.mode);
      });
      this.three.loading = true;
      this.three.model.datas.set([...datas, ...models]);
    },
  };

  /** 摄像机元素相关状态与操作集合 */
  element = {
    /** 元素是否正在加载（用于 wait 等待） */
    loading: false,
    /** 元素选中事件（对外通知被选中的元素 ID） */
    select: new EventEmitter<string>(),
    /** standby 待绑定 marker 参数（响应式信号） */
    standby: signal<MarkerArgs | undefined>(undefined),
    /** 摄像机元素列表（响应式信号） */
    datas: signal<GeoMapElement[]>([]),
    on: {
      /** 元素加载完成回调：清除加载中标记 */
      loaded: () => {
        this.element.loading = false;
      },
      camera: {
        viewfield: (args: MarkerViewfieldArgs) => {
          this.viewfield.emit(args);
        },
      },
    },
    /**
     * 按模型 ID 查找摄像机元素
     * @param modelId 元素 ID
     * @returns 匹配的元素，未找到返回 undefined
     */
    get: (modelId: string) => {
      let elements = this.element.datas();
      return elements.find((x) => x.ElementId == modelId);
    },
    /**
     * 加载摄像机元素并转换为 3D 标记
     * @param floorId 可选楼层 ID；传入时仅加载该楼层下的摄像机，缺省加载全部
     */
    load: async (floorId?: string) => {
      let cameras = await this.business.element.load(floorId);
      this.element.loading = true;
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

  /** 地图相关状态与操作集合 */
  map = {
    /** 地图数据（响应式信号） */
    data: signal<MapModel | undefined>(undefined),
    /**
     * 按文件名查找地图
     * @param modelId 地图文件名
     * @returns 匹配的地图，未找到返回 undefined
     */
    get: (modelId: string) => {
      let map = this.map.data();
      if (map && map.file && map.file.name == modelId) {
        return map;
      }
      return undefined;
    },
    /**
     * 加载地图：输出地图、执行初始化，并转换为 3D 村庄模型
     */
    load: async () => {
      let map = await this.business.load();

      this.map.data.set(map);
      if (this.outputable) {
        this.maploaded.emit(map);
      }
      if (map) {
        await this.init(map);
        let datas = this.three.model.datas();
        let village = this.converter.map.to.village(map, this.three.mode);
        this.three.loading = true;
        this.three.model.datas.set([...datas, village]);
      }
    },
  };

  /** 楼层相关状态与操作集合 */
  floor = {
    /** 当前楼层模型文件（响应式信号） */
    model: signal<ModelFile | undefined>(undefined),
    /** 当前楼层的楼层元素列表（响应式信号） */
    datas: signal<GeoMapElement[]>([]),
    /** 当前选中的楼层元素（响应式信号） */
    selected: signal<GeoMapElement | undefined>(undefined),
    /** 楼层可见性变化事件：携带模型 ID 与各楼层的可见性映射 */
    target: new EventEmitter<{ id: string; visibility: Record<string, boolean> }>(),

    /**
     * 加载指定建筑的楼层数据
     * @param building 建筑元素
     * @param file 楼层模型文件
     */
    load: async (building: GeoMapElement, file: ModelFile) => {
      this.floor.model.set(file);
      let datas = await this.business.element.building.floor.load(building.Id);
      this.floor.datas.set(datas);
      if (datas.length == 1) {
        this.floor.on.select(datas[0]);
      }
    },
    /** 清空楼层状态（模型、楼层列表、选中项） */
    clear: () => {
      this.floor.model.set(undefined);
      this.floor.datas.set([]);
      this.floor.selected.set(undefined);
    },

    on: {
      /**
       * 选中楼层：设置各楼层可见性，并加载该楼层下的摄像机
       * @param data 被选中的楼层元素
       */
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

        await this.element.load(data.Id);

        setTimeout(() => {
          this.three.focus.emit();
        }, 10);
      },
      /**
       * 返回总览：清空楼层与模型，重新加载地图、建筑与元素
       */
      back: async () => {
        this.outputable = false;
        this.floor.clear();
        this.three.model.clear();

        await Promise.all([this.map.load(), this.building.load(), this.element.load()]);

        this.outputable = true;
      },
    },
  };

  /** 3D 组件交互相关状态与事件集合 */
  three = {
    /** 3D 组件是否已初始化 */
    inited: false,
    /** 3D 模型是否正在加载 */
    loading: false,
    /** 渲染模式 */
    mode: RenderMode.overlay,
    /** 3D 视图聚焦事件（携带 FitView 或空） */
    focus: new EventEmitter<FitView | void>(),
    /** 3D 视图移动定位事件（携带定位参数） */
    moveto: new EventEmitter<MoveToArgs>(),
    model: {
      /** 3D 模型数据列表（响应式信号） */
      datas: signal<ModelViewerModel[]>([]),
      /** 清空 3D 模型数据 */
      clear: () => {
        this.three.loading = true;
        this.three.model.datas.set([]);
      },
    },
    camera: {
      viewfield: ViewfieldMode.selected,
      /** 3D 摄像机标记数据列表（响应式信号） */
      datas: signal<MarkerEntity[]>([]),
    },

    on: {
      /** 3D 组件初始化完成回调：标记已初始化 */
      inited: () => {
        this.three.inited = true;
      },
      /**
       * 3D 模型加载完成回调：清除加载中标记并聚焦视图
       * @param datas 加载完成的模型变换配置列表
       */
      loaded: (datas: ModelTransformConfig[]) => {
        this.three.loading = false;
        setTimeout(() => {
          this.three.focus.emit();
        }, 10);
      },
      standby: {
        /**
         * standby 点位绑定回调：组装绑定参数并对外输出
         * @param data standby 点击参数（世界坐标与附带数据）
         */
        binding: (data: StandbyClickArgs) => {
          let parent: GeoMapElement | undefined;
          if (this.floor.model()) {
            let floor = this.floor.selected();
            if (!floor) {
              this.toastr.warning('请先选择楼层');
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
        /** 取消 standby 绑定回调：对外输出取消事件 */
        cancel: () => {
          this.standbyCancel.emit();
        },
      },

      building: {
        /**
         * 建筑选中回调（预留，当前仅调试输出）
         * @param modelId 被选中的建筑模型 ID
         */
        select: (modelId: string) => {
          let building = this.building.get(modelId);
          console.log(building);
        },
        /**
         * 建筑展开回调：加载该建筑的楼层模型并替换为当前视图
         * @param modelId 建筑模型 ID
         */
        expand: async (modelId: string) => {
          let building = this.building.get(modelId);
          if (building) {
            let expansion = await this.business.model.get.expansion(modelId);
            if (expansion) {
              this.manager.building.show = false;
              this.floor.load(building, expansion);
              let model = this.converter.model.from.file(expansion, building, this.three.mode);
              model.position = { x: 0, y: 0, z: 0 };
              this.three.loading = true;
              this.three.model.datas.set([model]);
            }
          }
        },
      },
    },
  };

  /** 界面管理状态与操作集合 */
  manager = {
    building: {
      /** 建筑列表面板是否展开 */
      show: false,
      /**
       * 选中建筑：移动 3D 视图定位到该建筑
       * @param data 被选中的建筑元素
       */
      select: (data: GeoMapElement) => {
        this.three.moveto.emit({ modelId: data.ElementId });
      },
      /**
       * 展开建筑：进入该建筑的楼层视图
       * @param data 被点击展开的建筑元素
       */
      expand: (data: GeoMapElement) => {
        if (data.ElementId) {
          this.manager.building.show = false;
          this.three.on.building.expand(data.ElementId);
        }
      },
    },
    button: {
      /**
       * 底部建筑按钮点击：楼层视图下返回总览，否则切换建筑列表面板
       */
      building: () => {
        if (this.floor.model()) {
          this.floor.on.back();
        } else {
          this.manager.building.show = !this.manager.building.show;
        }
      },
      viewfield: () => {
        if (this.three.camera.viewfield == ViewfieldMode.show)
          this.three.camera.viewfield = ViewfieldMode.selected;
        else {
          this.three.camera.viewfield = ViewfieldMode.show;
        }
      },
    },
  };
}
