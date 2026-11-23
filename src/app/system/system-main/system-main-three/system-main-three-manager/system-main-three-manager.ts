import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MapElementType } from '../../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../../common/data-core/models/geographic/map.model';
import { WheelCtrlDirective } from '../../../../common/directives/wheel-ctrl/wheel-ctrl.directive';
import { ThreeDConfig } from '../../../../common/storage/three-d-storage/three-d-store.model';
import { SystemMainThreeBusiness } from '../business/system-main-three.business';
import { SystemMainThreeArgs } from '../business/system-main-three.model';
import { SystemMainThreeContainerComponent } from '../system-main-three-container/system-main-three-container.component';
import { SystemMainThreeElementGroupManagerComponent } from '../system-main-three-element-group/system-main-three-element-group-manager/system-main-three-element-group-manager.component';
import { SystemMainThreeStateComponent } from '../system-main-three-state/system-main-three-state.component';

@Component({
  selector: 'hw-system-main-three-manager',
  imports: [
    CommonModule,
    WheelCtrlDirective,
    SystemMainThreeContainerComponent,
    SystemMainThreeStateComponent,
    SystemMainThreeElementGroupManagerComponent,
  ],
  templateUrl: './system-main-three-manager.html',
  styleUrl: './system-main-three-manager.less',
  providers: [SystemMainThreeBusiness],
})
export class SystemMainThreeManager implements OnInit, OnDestroy {
  @Input() load?: EventEmitter<void>;
  @Input() alarm?: EventEmitter<string>;
  @Input() unalarm?: EventEmitter<GeoMapElement>;
  @Input() renderPaused = false;
  @Output() preview = new EventEmitter<GeoMapElement>();
  @Output() video = new EventEmitter<GeoMapElement[]>();
  @Output() element = new EventEmitter<{
    type?: MapElementType;
    state?: number;
    buildingId?: string;
    ids?: string[];
  }>();
  @Output() resetstate = new EventEmitter<GeoMapElement>();
  @Output() expandscreen = new EventEmitter<boolean>();
  @Output() fullscreen = new EventEmitter<boolean>();
  constructor(private business: SystemMainThreeBusiness) {}

  config?: ThreeDConfig;
  private subs = new Subscription();

  ngOnInit(): void {
    this.regist();
    this.state.load();
    this.business.config.load().then((x) => {
      this.config = x;
    });
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private regist() {
    if (this.load) {
      this.subs.add(
        this.load.subscribe(() => {
          this.map.args.usecache = false;
          this.map.load.emit(this.map.args);
          /* 统计面板和分组树展示权限过滤后的最新数据，跟随定时器（每分钟）和报警事件一起刷新 */
          this.state.load();
        }),
      );
    }
  }

  /**	统计面板数据：全量元素已按视频通道权限过滤（见 element.all），
      权限外的摄像机不统计，也不受当前展开的楼层/建筑限制；
      由 load（每分钟定时 + 报警事件）驱动刷新，保证状态最新 */
  state = {
    /** 服务端返回的全量元素（状态最新，已按通道权限过滤） */
    source: [] as GeoMapElement[],
    /** 实际交给统计面板的数据 */
    datas: signal<GeoMapElement[]>([]),
    loading: false,
    load: async () => {
      /* 事件密集时避免并发发起多次全量请求，跳过本次即可，下一次事件会再刷新 */
      if (this.state.loading) return;
      this.state.loading = true;
      try {
        let source = await this.business.element.all(false);
        this.state.source = source;
        /*	分组树与场景/统计共用同一份新鲜数据：元素接口缓存最多滞后 30 分钟，
            刚绑定到地图上的点位会出现在场景里，却在分组树里找不到，
            对应的区域资源也一直不显示。
            换一个新数组：树组件只在引用变化时重建 */
        this.elementgroup.datas = [...source];
        this.state.update();
      } catch {
        /* 刷新失败时保留上一次的统计，等下一次定时刷新 */
      } finally {
        this.state.loading = false;
      }
    },
    /**	统计口径与场景一致：直接使用已按通道权限过滤的全量数据 */
    update: () => {
      this.state.datas.set([...this.state.source]);
    },
  };

  /**	点位分组树：与场景/统计共用同一份新鲜的元素列表，摄像机按区域树分组；
      show 与面板双向绑定，容器据此把右下角按钮让出来 */
  elementgroup = {
    datas: [] as GeoMapElement[],
    show: true,
    /**	被眼睛按钮隐藏的点位 Id：容器据此不渲染对应 marker */
    hidden: new Set<string>(),
    /**	场景实际隐藏的点位 Id（只有手动隐藏）
        （用 signal：树是异步重建的，需要主动通知变更检测） */
    allhidden: signal<ReadonlySet<string>>(new Set<string>()),
    /**	定位事件：转发给容器（容器知道点位在不在当前场景、要不要进楼） */
    position: new EventEmitter<GeoMapElement>(),
    /**	双击摄像机：播放实时视频预览（无预览权限时上层直接忽略） */
    preview: new EventEmitter<GeoMapElement>(),
    on: {
      position: (element: GeoMapElement) => {
        /*	不可见的点位在树上定位按钮是禁用的，这里不会再收到隐藏点位的定位 */
        this.elementgroup.position.emit(element);
      },
      visible: (element: GeoMapElement) => {
        this.elementgroup.change.visible(element);
      },
      /**	分组节点：一次更新整组点位的显示/隐藏 */
      visibleAll: (e: { ids: string[]; visible: boolean }) => {
        let hidden = new Set(this.elementgroup.hidden);
        for (const id of e.ids) {
          if (e.visible) {
            hidden.delete(id);
          } else {
            hidden.add(id);
          }
        }
        this.elementgroup.hidden = hidden;
        this.elementgroup.update.hidden();
      },
    },
    change: {
      /**	显示/隐藏点位：换一个新的 Set，输入引用变化才能触发子组件刷新 */
      visible: (element: GeoMapElement) => {
        let hidden = new Set(this.elementgroup.hidden);
        if (hidden.has(element.Id)) {
          hidden.delete(element.Id);
        } else {
          hidden.add(element.Id);
        }
        this.elementgroup.hidden = hidden;
        this.elementgroup.update.hidden();
      },
    },
    update: {
      /**	换新引用，容器/树才会收到变更（只有手动隐藏，未分组不再自动隐藏） */
      hidden: () => {
        this.elementgroup.allhidden.set(new Set(this.elementgroup.hidden));
      },
    },
  };

  map = {
    data: undefined as GeoMap | undefined,
    args: new SystemMainThreeArgs(),
    load: new EventEmitter<SystemMainThreeArgs>(),
    on: {
      maploaded: (data: GeoMap) => {
        this.map.data = data;
      },
      preview: (data: GeoMapElement) => {
        this.preview.emit(data);
      },
      video: (datas: GeoMapElement[]) => {
        this.video.emit(datas);
      },
      resetstate: (data: GeoMapElement) => {
        this.resetstate.emit(data);
      },
      expandscreen: (value: boolean) => {
        this.expandscreen.emit(value);
      },
      fullscreen: (value: boolean) => {
        this.fullscreen.emit(value);
      },
    },
  };

  on = {
    /**	点位名称同步完成：重新加载场景点位、统计面板和分组树，显示新名称 */
    synced: () => {
      this.map.args.usecache = false;
      this.map.load.emit(this.map.args);
      this.state.load();
    },
    change: (value: number) => {
      if (this.config) {
        this.config.find.radius = value;
        this.business.config.save(this.config);
      }
    },
    element: (details: { type?: MapElementType; state?: number }) => {
      /*	统计面板展示的是全量数据，查看全部也只按类型过滤，不再带建筑条件；
          把这份全量数据的 ElementId 一起传给元素列表窗口：
          它已经按视频通道权限过滤过（只过滤摄像机），列表用它做服务端 ElementIds 过滤，
          非摄像机元素（报警器/传感器/出入口）就不会被通道 Id 误过滤掉。
          点击在线/异常数字时还要带上状态，列表只显示对应状态的元素 */
      let ids = this.state.source
        .map((x) => x.ElementId)
        .filter((x): x is string => !!x);
      this.element.emit({
        type: details.type,
        state: details.state,
        ids: Array.from(new Set(ids)),
      });
    },
  };
}
