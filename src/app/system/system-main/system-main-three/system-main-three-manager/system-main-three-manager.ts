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
  /**	是否隐藏「未分组」：权限过滤后区域树里查不到的点位落到「未分组」，
      隐藏该分组的同时把这些点位在场景中一并隐藏 */
  @Input() hideUnmatched = true;
  @Output() preview = new EventEmitter<GeoMapElement>();
  @Output() video = new EventEmitter<GeoMapElement[]>();
  @Output() element = new EventEmitter<{ type?: MapElementType; buildingId?: string }>();
  @Output() resetstate = new EventEmitter<GeoMapElement>();
  @Output() expandscreen = new EventEmitter<boolean>();
  @Output() fullscreen = new EventEmitter<boolean>();
  constructor(private business: SystemMainThreeBusiness) {}

  config?: ThreeDConfig;
  private subs = new Subscription();

  ngOnInit(): void {
    this.regist();
    this.state.load();
    this.elementgroup.load();
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
          /* 统计面板展示全量数据，跟随定时器（每分钟）和报警事件一起刷新状态 */
          this.state.load();
          this.elementgroup.load();
        }),
      );
    }
  }

  /**	两个 Id 集合内容是否相同 */
  private same(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
    if (a.size != b.size) return false;
    for (const id of a) {
      if (!b.has(id)) return false;
    }
    return true;
  }

  /**	统计面板数据：全量元素，不受当前展开的楼层/建筑限制，
      由 load（每分钟定时 + 报警事件）驱动刷新，保证状态最新 */
  state = {
    datas: [] as GeoMapElement[],
    loading: false,
    load: async () => {
      /* 事件密集时避免并发发起多次全量请求，跳过本次即可，下一次事件会再刷新 */
      if (this.state.loading) return;
      this.state.loading = true;
      try {
        this.state.datas = await this.business.element.all(false);
      } catch {
        /* 刷新失败时保留上一次的统计，等下一次定时刷新 */
      } finally {
        this.state.loading = false;
      }
    },
  };

  /**	点位分组树：全部地图元素（含楼栋/楼层，树里不出这两类），摄像机按区域树分组；
      show 与面板双向绑定，容器据此把右下角按钮让出来 */
  elementgroup = {
    datas: [] as GeoMapElement[],
    show: true,
    /**	被眼睛按钮隐藏的点位 Id：容器据此不渲染对应 marker */
    hidden: new Set<string>(),
    /**	因隐藏「未分组」而自动隐藏的点位 Id */
    unmatched: new Set<string>(),
    /**	场景实际隐藏的点位 Id：手动隐藏 + 未分组自动隐藏
        （用 signal：未分组隐藏是由异步构建触发的，需要主动通知变更检测） */
    allhidden: signal<ReadonlySet<string>>(new Set<string>()),
    /**	定位事件：转发给容器（容器知道点位在不在当前场景、要不要进楼） */
    position: new EventEmitter<GeoMapElement>(),
    /**	双击摄像机：播放实时视频预览（无预览权限时上层直接忽略） */
    preview: new EventEmitter<GeoMapElement>(),
    load: async () => {
      try {
        /*	换一个新数组：元素缓存返回的是同一个数组，引用不变时树组件不会收到变更，
            区域分组（可能在视频页刚调整过）就一直停在打开页面时的那份数据 */
        this.elementgroup.datas = [...(await this.business.element.all())];
      } catch {
        /* 刷新失败时保留上一次的分组 */
      }
    },
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
      /**	「未分组」下的点位：隐藏未分组时一并隐藏，取消隐藏时恢复 */
      unmatched: (ids: string[]) => {
        let next = new Set(ids);
        if (this.same(this.elementgroup.unmatched, next)) return;
        this.elementgroup.unmatched = next;
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
      /**	合并手动隐藏与未分组自动隐藏：换新引用，容器/树才会收到变更 */
      hidden: () => {
        this.elementgroup.allhidden.set(
          new Set([...this.elementgroup.hidden, ...this.elementgroup.unmatched]),
        );
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
    change: (value: number) => {
      if (this.config) {
        this.config.find.radius = value;
        this.business.config.save(this.config);
      }
    },
    element: (type?: MapElementType) => {
      /*	统计面板展示的是全量数据，查看全部也只按类型过滤，不再带建筑条件 */
      this.element.emit({ type: type });
    },
  };
}
