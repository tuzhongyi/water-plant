import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { GeoMap } from '../../../common/data-core/models/geographic/map.model';
import { IconTool } from '../../../common/tools/icon-tool/icon.tool';
import { FlatTreeNode, TreeComponent } from '../tree.component';
import { TreeMapElementBusiness } from './business/tree-map-element.business';
import { TreeMapBusiness } from './business/tree-map.business';

@Component({
  selector: 'hw-tree-map',
  imports: [TreeComponent],
  templateUrl: './tree-map.component.html',
  styleUrls: ['./tree-map.component.less'],
  providers: [TreeMapBusiness, TreeMapElementBusiness],
})
export class TreeMapComponent implements AfterViewInit, OnDestroy {
  @Input() selected?: GeoMap | GeoMapElement;
  @Output() selectedChange = new EventEmitter<GeoMap | GeoMapElement | undefined>();

  @Input('load') reload?: EventEmitter<void>;
  @Output() loaded = new EventEmitter<GeoMap[]>();

  @Output() edit = new EventEmitter<GeoMap | GeoMapElement>();
  @Output() delete = new EventEmitter<GeoMap | GeoMapElement>();
  @Output() bind = new EventEmitter<GeoMap | GeoMapElement>();
  @Output() unbind = new EventEmitter<GeoMap | GeoMapElement>();

  @Input() editable = true;
  @Input() deleteable = true;
  @Input() bindable = true;
  @Input() deselectable = true;

  nodes: FlatTreeNode[] = [];
  selectedId?: string;

  constructor(private business: TreeMapBusiness) {}

  private subs = new Subscription();

  ngAfterViewInit(): void {
    this.loadTree();
    if (this.reload) {
      this.subs.add(this.reload.subscribe(() => this.loadTree()));
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private async loadTree(): Promise<void> {
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
    } catch {
      this.loaded.emit([]);
    }
  }

  /* 将层级数据展开为可见的扁平列表 */
  private buildTree(data: { map: GeoMap; elements: GeoMapElement[] }[]): void {
    this.nodes = [];
    for (const { map, elements } of data) {
      this.addNode(map.Id, map.Name, 0, 'map', map);
      this.addElementChildren(elements, 1, undefined);
    }
  }

  private addElementChildren(elements: GeoMapElement[], level: number, parentId?: string): void {
    for (const e of elements) {
      if (parentId ? e.ParentId === parentId : !e.ParentId) {
        this.addNode(e.Id, e.Name, level, 'element', e);
        this.addElementChildren(elements, level + 1, e.Id);
      }
    }
  }

  private addNode(id: string, name: string, level: number, type: 'map' | 'element', data: any): void {
    const isMap = type === 'map';
    const iconClass = isMap
      ? 'howell-icon-map5'
      : IconTool.MapElementType((data as GeoMapElement).ElementType as MapElementType) || '';

    let btns = '';
    if (!isMap && this.bindable) {
      const el = data as GeoMapElement;
      const text = el.ElementId ? '解绑' : '绑定';
      btns += `<button class="hw-tree-btn hw-tree-btn-text">${text}</button>`;
    }

    const html = `<i class="hw-tree-icon ${iconClass}" style="${iconClass ? '' : 'display:none'}"></i>
      <span class="hw-tree-label">${name}</span>
      <span class="hw-tree-actions">${btns}</span>`;

    this.nodes.push({
      id, label: name, level,
      expandable: false, html, data: { type, data },
    });
  }

  onNodeClick(node: FlatTreeNode): void {
    if (node.data?.type === 'element' || node.data?.type === 'map') {
      this.selected = node.data.data;
      this.selectedChange.emit(node.data.data);
    }
  }
}
