import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import Tree from '@widgetjs/tree';
import { Subscription } from 'rxjs';
import { MapElementType } from '../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../common/data-core/models/geographic/map.model';
import { IconTool } from '../../common/tools/icon-tool/icon.tool';
import { MapTreeElementBusiness } from './business/map-tree-element.business';
import { MapTreeBusiness } from './business/map-tree.business';
import { MapTreeNode } from './map-tree.model';

const SELECTED_CLASS = 'treejs-selected';

/** 唯一 id 计数器 */
let treeInstanceId = 0;

@Component({
  selector: 'hw-map-tree',
  imports: [],
  templateUrl: './map-tree.component.html',
  styleUrl: './map-tree.component.less',
  providers: [MapTreeBusiness, MapTreeElementBusiness],
})
export class MapTreeComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** 外部设置选中项，传 undefined 取消选中 */
  @Input() selected?: GeoMap | GeoMapElement;
  /** 选中变化时触发，取消选中时 emit undefined */
  @Output() selectedChange = new EventEmitter<GeoMap | GeoMapElement | undefined>();

  /** 外部触发 — 重新加载 */
  @Input('load') reload?: EventEmitter<void>;
  @Output() loaded = new EventEmitter<GeoMap[]>();

  /** 节点操作：编辑、删除、绑定/解绑 */
  @Output() edit = new EventEmitter<GeoMap | GeoMapElement>();
  @Output() delete = new EventEmitter<GeoMap | GeoMapElement>();
  @Output() bind = new EventEmitter<GeoMap | GeoMapElement>();
  @Output() unbind = new EventEmitter<GeoMap | GeoMapElement>();
  @Output() position = new EventEmitter<GeoMap | GeoMapElement>();

  @Input() editable = true;
  @Input() deleteable = true;
  @Input() bindable = true;
  @Input() positionable = true;

  readonly containerId = `map-tree-${++treeInstanceId}`;

  constructor(private business: MapTreeBusiness) {}

  private tree?: Tree;
  private selectedNodeId?: string;
  private suppress = false;
  private subs = new Subscription();

  ngAfterViewInit(): void {
    this.load();
    this.registEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selected'] && this.tree) {
      this.applySelected();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.tree = undefined;
  }

  /* ---- 外部事件订阅 ---- */

  private registEvents(): void {
    if (this.reload) {
      this.subs.add(this.reload.subscribe(() => this.load()));
    }
  }

  /* ---- 数据加载 ---- */

  private async load(): Promise<void> {
    try {
      const maps = await this.business.load();
      this.loaded.emit(maps);
      if (!maps || maps.length === 0) return;

      const mapWithElements = await Promise.all(
        maps.map(async (map) => {
          const elements = await this.business.element.load(map.Id);
          return { map, elements };
        }),
      );
      this.buildTree(mapWithElements);
    } catch (err) {
      this.loaded.emit([]);
    }
  }

  /* ---- Tree 构建 ---- */

  private buildTree(data: { map: GeoMap; elements: GeoMapElement[] }[]): void {
    this.tree = undefined;
    this.selectedNodeId = undefined;

    const nodes: MapTreeNode[] = data.map(({ map, elements }) => ({
      id: map.Id,
      text: map.Name,
      attributes: { type: 'map', data: map },
      children: this.buildElementNodes(elements),
      data: map,
    }));

    this.tree = new Tree(`#${this.containerId}`, {
      data: nodes,
      onChange: () => this.onTreeChange(),
      closeDepth: 1,
    });

    /* 自定义节点 DOM：图标 + 操作按钮 */
    this.customizeNodes();

    if (this.selected) {
      this.applySelected();
    }
  }

  private buildElementNodes(elements: GeoMapElement[], parentId?: string): MapTreeNode[] {
    return elements
      .filter((e) => (parentId ? e.ParentId === parentId : !e.ParentId))
      .map((e) => ({
        id: e.Id,
        text: e.Name,
        attributes: { type: 'element', data: e },
        children: this.buildElementNodes(elements, e.Id),
        data: e,
      }));
  }

  /* ---- 节点 DOM 自定义 ---- */

  /** 遍历所有节点，插入图标和操作按钮 */
  private customizeNodes(): void {
    if (!this.tree) return;
    const nodesById = (this.tree as any).nodesById as Record<string, any>;
    const liById = (this.tree as any).liElementsById as Record<string, HTMLLIElement>;
    if (!nodesById || !liById) return;

    for (const [id, node] of Object.entries(nodesById)) {
      const li = liById[id];
      if (!li) continue;

      const data = node.attributes?.data as GeoMap | GeoMapElement;
      const isMap = node.attributes?.type === 'map';

      /* 图标 */
      const icon = document.createElement('i');
      icon.className = isMap
        ? 'howell-icon-map5 map-tree-icon'
        : `map-tree-icon ${this.getElementIcon(data as GeoMapElement)}`;
      if (icon.className) {
        li.insertBefore(icon, li.querySelector('.treejs-label'));
      }

      /* 操作按钮容器 */
      const actions = document.createElement('div');
      actions.className = 'map-tree-actions';

      /* 编辑按钮 */
      const btnEdit = this.createButton('编辑', 'howell-icon-edit', () => {
        this.edit.emit(data);
      });
      actions.appendChild(btnEdit);

      /* 删除按钮 */
      const btnDelete = this.createButton('删除', 'howell-icon-delete', () => {
        this.delete.emit(data);
      });
      actions.appendChild(btnDelete);

      /* 绑定/解绑按钮（仅 GeoMapElement） */
      if (!isMap) {
        const element = data as GeoMapElement;
        const hasBind = !!element.ElementId;
        const bindText = hasBind ? '解绑' : '绑定';
        const btnBind = this.createTextButton(bindText, () => {
          if (element.ElementId) {
            this.unbind.emit(data);
          } else {
            this.bind.emit(data);
          }
        });
        actions.appendChild(btnBind);
      }

      li.appendChild(actions);
    }
  }

  /** 根据 ElementType 获取图标类名 */
  private getElementIcon(element: GeoMapElement): string {
    const type = element.ElementType as MapElementType;
    return IconTool.MapElementType(type);
  }

  /** 创建图标按钮 */
  private createButton(title: string, iconClass: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'map-tree-btn';
    btn.title = title;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    const icon = document.createElement('i');
    icon.className = iconClass;
    btn.appendChild(icon);
    return btn;
  }

  /** 创建文字按钮（绑定/解绑） */
  private createTextButton(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'map-tree-btn map-tree-btn-text';
    btn.textContent = text;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  /* ---- 单选 + 取消选中逻辑 ---- */

  private onTreeChange(): void {
    if (this.suppress || !this.tree) return;

    const nodes = this.tree.selectedNodes;

    if (nodes.length === 0) {
      this.removeSelectedClass();
      this.selectedNodeId = undefined;
      this.selectedChange.emit(undefined);
      return;
    }

    const target = nodes[0];
    if (nodes.length > 1) {
      this.suppress = true;
      this.tree.values = [];
      this.tree.values = [target.id];
      this.suppress = false;
    }

    this.setSelectedClass(target.id);
    const data = target.attributes?.['data'] as GeoMap | GeoMapElement;
    this.selectedChange.emit(data);
  }

  private applySelected(): void {
    if (!this.tree) return;

    this.removeSelectedClass();

    if (!this.selected) {
      this.suppress = true;
      this.tree.values = [];
      this.suppress = false;
      this.selectedNodeId = undefined;
      return;
    }

    const targetId = this.selected.Id;
    this.suppress = true;
    this.tree.values = [];
    this.tree.values = [targetId];
    this.suppress = false;

    this.setSelectedClass(targetId);
  }

  /* ---- CSS 样式切换 ---- */

  private setSelectedClass(id: string): void {
    const li = (this.tree as any)?.liElementsById?.[id] as HTMLElement | undefined;
    if (li) {
      li.classList.add(SELECTED_CLASS);
    }
    this.selectedNodeId = id;
  }

  private removeSelectedClass(): void {
    if (!this.selectedNodeId) return;
    const li = (this.tree as any)?.liElementsById?.[this.selectedNodeId] as HTMLElement | undefined;
    if (li) {
      li.classList.remove(SELECTED_CLASS);
    }
    this.selectedNodeId = undefined;
  }
}
