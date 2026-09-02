import {
  AfterViewInit,
  ChangeDetectorRef,
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
import { DB31Channel } from '../../../common/data-core/models/db31/db31-channel.model';
import { Device } from '../../../common/data-core/models/devices/device.model';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { IconTool } from '../../../common/tools/icon-tool/icon.tool';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import { FlatTreeNode, TreeComponent } from '../component/tree.component';
import { TreeDeviceBusiness } from './tree-device.business';
import { IDevice, KeyNameValue, TreeDeviceArgs } from './tree-device.model';

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

  @Input('load') reload?: EventEmitter<TreeDeviceArgs>;
  @Output() loaded = new EventEmitter<Record<string, IDevice[]>>();

  @Input() bound: GeoMapElement[] = [];
  @Output() bind = new EventEmitter<VideoChannel>();
  @Output() unbind = new EventEmitter<VideoChannel>();
  @Output() position = new EventEmitter<VideoChannel>();

  nodes: FlatTreeNode[] = [];
  selectedId?: string;

  constructor(
    private business: TreeDeviceBusiness,
    private language: LanguageTool,
    private cdr: ChangeDetectorRef,
  ) {}

  private subs = new Subscription();
  private lastDatas?: Record<string, IDevice[]>;
  private lastTypes?: KeyNameValue[];
  private elements: GeoMapElement[] = [];
  private args: TreeDeviceArgs = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bound']) {
      this.elements = this.bound;
      // 首次加载时全量构建，后续只增量刷新绑定按钮，保留折叠状态
      if (this.nodes.length === 0 && this.lastDatas && this.lastTypes) {
        this.buildTree(this.lastTypes, this.lastDatas);
      } else {
        this.refreshChannelActions();
      }
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
      this.subs.add(
        this.reload.subscribe((x) => {
          this.args = x;
          this.loadTree();
        }),
      );
    }
  }

  /* ---- 数据加载 ---- */

  private async loadTree(): Promise<void> {
    try {
      const types = await this.business.types()();
      const datas = await this.business.load();
      this.lastTypes = types;
      this.lastDatas = datas;
      this.loaded.emit(datas);
      if (!datas || Object.keys(datas).length === 0) return;
      await this.buildTree(types, datas);
    } catch {
      this.loaded.emit({});
    }
  }

  /* ---- 树构建 ---- */

  private nodeIndex = 0;

  private async buildTree(types: KeyNameValue[], datas: Record<string, IDevice[]>): Promise<void> {
    this.nodes = [];
    this.nodeIndex = 0;
    const query = (this.args.name ?? '').trim().toLowerCase();

    for (const t of types) {
      const devices = datas[t.Key] ?? [];
      const name = t.Name || (await this.language.device.DeviceType(t.Value));

      if (query) {
        const catMatches = this.match(name, query);
        const catHasHit = devices.some(
          (d) => this.deviceMatches(d, query) || this.deviceHasHit(d, query),
        );
        /* 类别自身与下方均未命中则跳过 */
        if (!catMatches && !catHasHit) continue;
        /* 命中类别保留全部子节点；下方还有命中则展开，否则折叠 */
        this.addCategoryNode(t, name, catMatches ? catHasHit : true);
        for (const d of devices) {
          const dm = this.deviceMatches(d, query);
          const chHasHit = this.deviceHasHit(d, query);
          if (!dm && !chHasHit) continue;
          this.addDeviceNode(d, t.Key, dm ? chHasHit : true, query, dm);
        }
      } else {
        this.addCategoryNode(t, name, true);
        for (const d of devices) {
          this.addDeviceNode(d, t.Key, false, '', true);
        }
      }
    }
    this.cdr.detectChanges();
  }

  /* ---- bound 增量刷新 ---- */

  private refreshChannelActions(): void {
    for (const node of this.nodes) {
      if (node.level === 2 && node.data) {
        const ch = node.data as VideoChannel | DB31Channel;
        const isBound = this.elements.some((b) => b.ElementId === ch.Id);
        node.actionsHtml = isBound
          ? `<div class="button hw-tree-action-btn hw-tree-action-position primary" title="定位">
               <i class="glyphicon glyphicon-map-marker"></i>
             </div>
             <div class="button hw-tree-action-btn hw-tree-action-unbind redlight" title="解绑">
               <i class="howell-icon-Unlink"></i>
             </div>`
          : `<div class="button hw-tree-action-btn hw-tree-action-bind primary" title="绑定">
               <i class="howell-icon-Link"></i>
             </div>`;
      }
    }
    this.cdr.detectChanges();
  }

  /* ---- 节点添加 ---- */

  private addCategoryNode(type: KeyNameValue, name: string, expanded: boolean): void {
    const icon =
      IconTool.DeviceType(type.Value, type.Key.includes('db31')) || 'howell-icon-camera_line';
    this.nodes.push({
      id: `type_${type.Key}`,
      label: name || `类型${type.Value}`,
      level: 0,
      expandable: true,
      expanded,
      html: `<i class="hw-tree-icon ${icon}"></i><span class="hw-tree-label">${name || `类型${type.Value}`}</span>`,
      data: type,
    });
  }

  private addDeviceNode(
    d: IDevice,
    parentTypeId: string,
    expanded: boolean,
    query: string,
    matched: boolean,
  ): void {
    const deviceId = `dev_${parentTypeId}_${d.Id}_${this.nodeIndex++}`;
    this.nodes.push({
      id: deviceId,
      label: d.Name || d.Id,
      level: 1,
      parentId: `type_${parentTypeId}`,
      expandable: true,
      expanded,
      html: `<i class="hw-tree-icon ${d.Icon}"></i><span class="hw-tree-label">${d.Name || d.Id}</span>`,
      data: d,
    });

    /* 添加通道子节点：命中设备保留全部，否则仅保留命中通道 */
    for (const ch of this.channelsOf(d)) {
      if (matched || this.match(ch.Name, query)) {
        this.addChannelNode(ch, deviceId, d.Icon);
      }
    }
  }

  private addChannelNode(ch: VideoChannel | DB31Channel, deviceId: string, icon: string): void {
    const chId = ch.Id;
    const nodeId = `ch_${deviceId}_${chId}_${this.nodeIndex++}`;
    const isBound = this.elements.some((b) => b.ElementId === chId);
    const btn = isBound
      ? `<div class="button hw-tree-action-btn hw-tree-action-position primary" title="定位">
           <i class="glyphicon glyphicon-map-marker"></i>
         </div>
         <div class="button hw-tree-action-btn hw-tree-action-unbind redlight" title="解绑">
           <i class="howell-icon-Unlink"></i>
         </div>`
      : `<div class="button hw-tree-action-btn hw-tree-action-bind primary" title="绑定">
           <i class="howell-icon-Link"></i>
         </div>`;

    if (ch instanceof VideoChannel) {
      icon = 'howell-icon-camera_line';
    }

    this.nodes.push({
      id: nodeId,
      label: ch.Name || `通道${ch.DeviceId || ''}`,
      level: 2,
      parentId: deviceId,
      html: `<i class="hw-tree-icon ${icon}"></i><span class="hw-tree-label">${ch.Name || ch.DeviceId || ''}</span>`,
      actionsHtml: btn,
      data: ch,
    });
  }

  /* ---- 筛选辅助 ---- */

  private match(name: string | undefined, query: string): boolean {
    return (name ?? '').toLowerCase().includes(query);
  }

  private channelsOf(d: IDevice): (VideoChannel | DB31Channel)[] {
    const ipc = d as any;
    const list: (VideoChannel | DB31Channel)[] = [];
    if (ipc.Channel) list.push(ipc.Channel);
    if (ipc.Channels && Array.isArray(ipc.Channels)) list.push(...ipc.Channels);
    return list;
  }

  private deviceMatches(d: IDevice, query: string): boolean {
    return this.match(d.Name, query);
  }

  private deviceHasHit(d: IDevice, query: string): boolean {
    return this.channelsOf(d).some((ch) => this.match(ch.Name, query));
  }
}
