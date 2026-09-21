import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  ElementRef,
  EventEmitter,
  input,
  OnDestroy,
  output,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { InputIconComponent } from '../../../common/components/input-icon/input-icon.component';
import { Device } from '../../../common/data-core/models/devices/device.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { TreeDeviceComponent } from '../../../share/tree/tree-device/tree-device.component';
import { ITreeDevice, TreeDeviceArgs } from '../../../share/tree/tree-device/tree-device.model';

@Component({
  selector: 'hw-setting-device-tree',
  imports: [CommonModule, TreeDeviceComponent, InputIconComponent],
  templateUrl: './setting-device-tree.component.html',
  styleUrl: './setting-device-tree.component.less',
})
export class SettingDeviceTreeComponent implements OnDestroy {
  public load = input<EventEmitter<void>>();
  public elements = input<GeoMapElement[]>([]);
  public find = input<EventEmitter<GeoMapElement>>();
  public details = output<Device | undefined>();
  public loaded = output<Record<number, ITreeDevice[]>>();
  public selected = input<Device>();
  public selectedChange = output<Device>();
  public bind = output<VideoChannel>();
  public unbind = output<VideoChannel>();
  public position = output<VideoChannel>();

  /** 树容器，出滚动条时用它做滚动定位 */
  @ViewChild('body') private body?: ElementRef<HTMLElement>;
  @ViewChild('treeDevice') private treeDevice?: TreeDeviceComponent;

  constructor() {
    this.regist();
  }

  private subs = new Subscription();

  /**
   * 把当前选中的节点滚进可视区
   * 只有容器真的出现滚动条（内容高过容器）时才滚，否则不动
   */
  private scrollToSelected(): void {
    const container = this.body?.nativeElement;
    /* 节点 id 用的是树内部的合成 id，不是设备 / 通道 id，只能从子组件取 */
    const id = this.treeDevice?.selectedId;
    if (!container || !id) return;
    if (container.scrollHeight <= container.clientHeight) return;

    container
      .querySelector<HTMLElement>(`[data-node-id="${id}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  private regist() {
    effect(() => {
      const l = this.load();
      if (l) {
        this.subs.add(l.subscribe(() => this.tree.load.emit()));
      }
    });
    effect(() => {
      this.tree.bound.emit(this.elements());
    });
    effect(() => {
      const input = this.find();
      if (input) {
        this.subs.add(input.subscribe((x) => this.tree.to.find(x)));
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  protected tree = {
    args: {} as TreeDeviceArgs,
    load: new EventEmitter<TreeDeviceArgs>(),
    bound: new EventEmitter<GeoMapElement[]>(),
    find: new EventEmitter<string>(),
    on: {
      loaded: (datas: Record<number, ITreeDevice[]>) => {
        if (Object.keys(datas).length === 0) {
          this.details.emit(undefined);
        }
        this.loaded.emit(datas);
      },
      select: (data?: Device) => {
        this.selectedChange.emit(data!);
        this.scrollToSelected();
      },
      bind: (data: VideoChannel) => {
        this.bind.emit(data);
      },
      unbind: (data: VideoChannel) => {
        this.unbind.emit(data);
      },
      position: (data: any) => {
        this.position.emit(data);
      },
    },
    to: {
      search: () => {
        this.tree.load.emit(this.tree.args);
      },
      find: (data: GeoMapElement) => {
        if (data.ElementId) {
          this.tree.find.emit(data.ElementId);
        }
      },
    },
  };
}
