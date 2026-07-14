import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { EnumNameValue } from '../../../common/data-core/models/capabilities/enum-name-value.model';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { IconTool } from '../../../common/tools/icon-tool/icon.tool';
import { FlatTreeNode, TreeComponent } from '../tree.component';
import { TreeMapElementBusiness } from './tree-map-element.business';

@Component({
  selector: 'hw-tree-map-element',
  imports: [TreeComponent],
  templateUrl: './tree-map-element.component.html',
  styleUrl: './tree-map-element.component.less',
  providers: [TreeMapElementBusiness],
})
export class TreeMapElementComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() selected?: GeoMapElement;
  @Output() selectedChange = new EventEmitter<GeoMapElement | undefined>();

  @Input('load') reload?: EventEmitter<void>;
  @Output() loaded = new EventEmitter<Record<number, GeoMapElement[]>>();

  @Output() position = new EventEmitter<GeoMapElement>();
  @Input() typedisable: number[] = [];

  nodes: FlatTreeNode[] = [];
  selectedId?: string;

  constructor(private business: TreeMapElementBusiness) {}

  private subs = new Subscription();

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
    if (e.action === 'position') {
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
      const types = await this.business.types();
      const datas = await this.business.load();
      this.loaded.emit(datas);
      if (!datas || Object.keys(datas).length === 0) return;
      await this.buildTree(types, datas);
    } catch {
      this.loaded.emit({});
    }
  }

  /* ---- 树构建 ---- */

  private nodeIndex = 0;

  private async buildTree(
    types: EnumNameValue<number>[],
    datas: Record<number, GeoMapElement[]>,
  ): Promise<void> {
    this.nodes = [];
    this.nodeIndex = 0;
    for (const t of types) {
      /* typedisable 中包含该类型，去掉该根节点 */
      if (this.typedisable.includes(t.Value)) continue;
      const elements = datas[t.Value] ?? [];
      /* 根节点下没有数据，不显示该根节点 */
      if (elements.length === 0) continue;
      await this.addCategoryNode(t, elements.length);
      for (const el of elements) {
        this.addElementNode(el, t.Value);
      }
    }
  }

  /* ---- 节点添加 ---- */

  private async addCategoryNode(
    type: EnumNameValue<number>,
    count: number,
  ): Promise<void> {
    const name = type.Name;
    const icon = IconTool.MapElementType(type.Value) || 'howell-icon-map-pin';
    const countHtml = `<span class="hw-tree-count">${count}</span>`;

    this.nodes.push({
      id: `type_${type.Value}`,
      label: name || `类型${type.Value}`,
      level: 0,
      expandable: true,
      expanded: true,
      html: `<i class="hw-tree-icon ${icon}"></i><span class="hw-tree-label">${name || `类型${type.Value}`}</span>`,
      actionsHtml: countHtml,
      data: type,
    });
  }

  private addElementNode(element: GeoMapElement, parentTypeId: number): void {
    const nodeId = `el_${parentTypeId}_${element.Id}_${this.nodeIndex++}`;
    const icon = IconTool.MapElementType(element.ElementType) || 'howell-icon-map-pin';
    const btn = `<div class="button hw-tree-action-btn hw-tree-action-position green" title="定位">
                   <i class="glyphicon glyphicon-map-marker"></i>
                 </div>`;

    this.nodes.push({
      id: nodeId,
      label: element.Name || element.Id,
      level: 1,
      parentId: `type_${parentTypeId}`,
      html: `<i class="hw-tree-icon ${icon}"></i><span class="hw-tree-label">${element.Name || element.Id}</span>`,
      actionsHtml: btn,
      data: element,
    });
  }
}
