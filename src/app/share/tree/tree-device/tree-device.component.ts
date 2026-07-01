import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Device } from '../../../common/data-core/models/devices/device.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { IconTool } from '../../../common/tools/icon-tool/icon.tool';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import { FlatTreeNode, TreeComponent } from '../tree.component';
import { TreeDeviceBusiness } from './tree-device.business';

@Component({
  selector: 'hw-tree-device',
  imports: [TreeComponent],
  templateUrl: './tree-device.component.html',
  styleUrls: ['./tree-device.component.less'],
  providers: [TreeDeviceBusiness],
})
export class TreeDeviceComponent implements AfterViewInit, OnInit, OnChanges, OnDestroy {
  @Input() selected?: Device;
  @Output() selectedChange = new EventEmitter<Device | undefined>();

  @Input('load') reload?: EventEmitter<void>;
  @Output() loaded = new EventEmitter<Record<number, Device[]>>();

  @Input() bound: GeoMapElement[] = [];
  @Output() bind = new EventEmitter<VideoChannel>();
  @Output() unbind = new EventEmitter<VideoChannel>();
  @Output() position = new EventEmitter<VideoChannel>();

  nodes: FlatTreeNode[] = [];
  selectedId?: string;

  constructor(
    private business: TreeDeviceBusiness,
    private language: LanguageTool,
  ) {}

  private subs = new Subscription();
  private lastDatas?: Record<number, Device[]>;
  private elements: GeoMapElement[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bound']) {
      this.elements = this.bound;
      if (this.lastDatas) this.buildTree(this.lastDatas);
    }
  }

  ngOnInit(): void {
    this.regist();
  }

  ngAfterViewInit(): void {
    this.loadTree();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onAction(e: { action: string; node: FlatTreeNode }): void {
    if (!e.node.data) return;
    if (e.action === 'bind') {
      this.bind.emit(e.node.data);
    } else if (e.action === 'unbind') {
      this.unbind.emit(e.node.data);
    } else if (e.action === 'position') {
      this.position.emit(e.node.data);
    }
  }

  private regist() {
    if (this.reload) {
      this.subs.add(this.reload.subscribe(() => this.loadTree()));
    }
  }

  /* ---- 数据加载 ---- */

  private async loadTree(): Promise<void> {
    try {
      const datas = await this.business.load();
      this.lastDatas = datas;
      this.loaded.emit(datas);
      if (!datas || Object.keys(datas).length === 0) return;
      await this.buildTree(datas);
    } catch {
      this.loaded.emit({});
    }
  }

  /* ---- 树构建 ---- */

  private nodeIndex = 0;

  private async buildTree(datas: Record<number, Device[]>): Promise<void> {
    this.nodes = [];
    this.nodeIndex = 0;
    for (const [type, devices] of Object.entries(datas)) {
      await this.addCategoryNode(parseInt(type));
      for (const d of devices) {
        this.addDeviceNode(d, type);
      }
    }
  }

  /* ---- 节点添加 ---- */

  private async addCategoryNode(type: number): Promise<void> {
    const name = await this.language.device.DeviceType(type);
    const icon = IconTool.DeviceType(type) || 'howell-icon-camera_line';
    this.nodes.push({
      id: `type_${type}`,
      label: name || `类型${type}`,
      level: 0,
      expandable: true,
      expanded: true,
      html: `<i class="hw-tree-icon ${icon}"></i><span class="hw-tree-label">${name || `类型${type}`}</span>`,
      data: type,
    });
  }

  private addDeviceNode(d: Device, parentTypeId: string): void {
    const icon = IconTool.DeviceType(d.DeviceType) || 'howell-icon-camera_line';
    const deviceId = `dev_${parentTypeId}_${d.Id}_${this.nodeIndex++}`;
    this.nodes.push({
      id: deviceId,
      label: d.Name || d.Id,
      level: 1,
      parentId: `type_${parentTypeId}`,
      expandable: true,
      expanded: true,
      html: `<i class="hw-tree-icon ${icon}"></i><span class="hw-tree-label">${d.Name || d.Id}</span>`,
      data: d,
    });

    /* 添加通道子节点 */
    const ipc = d as any;
    if (ipc.Channel) {
      this.addChannelNode(ipc.Channel, deviceId);
    }
    if (ipc.Channels && Array.isArray(ipc.Channels)) {
      for (const ch of ipc.Channels) {
        this.addChannelNode(ch, deviceId);
      }
    }
  }

  private addChannelNode(ch: VideoChannel, deviceId: string): void {
    const chId = ch.Id;
    const nodeId = `ch_${deviceId}_${chId}_${this.nodeIndex++}`;
    const isBound = this.elements.some((b) => b.ElementId === chId);
    const btn = isBound
      ? `<div class="button hw-tree-action-btn hw-tree-action-position green" title="定位">
           <i class="glyphicon glyphicon-map-marker"></i>
         </div>
         <div class="button hw-tree-action-btn hw-tree-action-unbind redlight" title="解绑">
           <i class="howell-icon-Unlink"></i>
         </div>`
      : `<div class="button hw-tree-action-btn hw-tree-action-bind green" title="绑定">
           <i class="howell-icon-Link"></i>
         </div>`;
    this.nodes.push({
      id: nodeId,
      label: ch.Name || `通道${ch.DeviceId || ''}`,
      level: 2,
      parentId: deviceId,
      html: `<i class="hw-tree-icon howell-icon-camera_line"></i><span class="hw-tree-label">${ch.Name || ch.DeviceId || ''}</span>`,
      actionsHtml: btn,
      data: ch,
    });
  }
}
