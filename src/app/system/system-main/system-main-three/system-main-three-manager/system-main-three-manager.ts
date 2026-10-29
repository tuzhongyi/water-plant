import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapElementType } from '../../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../../common/data-core/models/geographic/map.model';
import { WheelCtrlDirective } from '../../../../common/directives/wheel-ctrl/wheel-ctrl.directive';
import { ThreeDConfig } from '../../../../common/storage/three-d-storage/three-d-store.model';
import { SystemMainThreeBusiness } from '../business/system-main-three.business';
import { SystemMainThreeArgs } from '../business/system-main-three.model';
import { SystemMainThreeContainerComponent } from '../system-main-three-container/system-main-three-container.component';
import { SystemMainThreeStateComponent } from '../system-main-three-state/system-main-three-state.component';

@Component({
  selector: 'hw-system-main-three-manager',
  imports: [
    CommonModule,
    WheelCtrlDirective,
    SystemMainThreeContainerComponent,
    SystemMainThreeStateComponent,
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
        }),
      );
    }
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
