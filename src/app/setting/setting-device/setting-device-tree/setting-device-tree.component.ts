import { Component, effect, EventEmitter, input, OnDestroy, output } from '@angular/core';
import { Subscription } from 'rxjs';
import { Device } from '../../../common/data-core/models/devices/device.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { TreeDeviceComponent } from '../../../share/tree/tree-device/tree-device.component';

@Component({
  selector: 'hw-setting-device-tree',
  imports: [TreeDeviceComponent],
  templateUrl: './setting-device-tree.component.html',
  styleUrl: './setting-device-tree.component.less',
})
export class SettingDeviceTreeComponent implements OnDestroy {
  load = input<EventEmitter<void>>();
  elements = input<GeoMapElement[]>([]);

  details = output<Device | undefined>();
  loaded = output<Record<number, Device[]>>();
  selected = input<Device>();
  selectedChange = output<Device>();
  bind = output<VideoChannel>();
  position = output<VideoChannel>();

  constructor() {
    this.regist();
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
  }

  private subs = new Subscription();

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  tree = {
    load: new EventEmitter<void>(),
    bound: new EventEmitter<GeoMapElement[]>(),
    loaded: (datas: Record<number, Device[]>) => {
      if (Object.keys(datas).length === 0) {
        this.details.emit(undefined);
      }
      this.loaded.emit(datas);
    },
    select: (data?: Device) => {
      this.selectedChange.emit(data!);
    },
    bind: (data: VideoChannel) => {
      this.bind.emit(data);
    },
    unbind: (data: VideoChannel) => {
      this.bind.emit(data);
    },
    position: (data: any) => {
      this.position.emit(data);
    },
  };
}
