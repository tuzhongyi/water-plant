import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MapElementType } from '../../../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../../../common/data-core/models/geographic/map-element.model';
import { RegionTreeNode } from '../../../../../common/data-core/models/regions/region-tree-node.model';
import { ArrayTool } from '../../../../../common/tools/array-tool/array.tool';
import { LocaleCompare } from '../../../../../common/tools/compare-tool/compare.tool';
import { IconTool } from '../../../../../common/tools/icon-tool/icon.tool';
import { Language } from '../../../../../common/tools/language-tool/language';
import { LanguageTool } from '../../../../../common/tools/language-tool/language.tool';
import { FlatTreeNode, TreeComponent } from '../../../../../share/tree/component/tree.component';
import { SystemMainThreeElementGroupTreeBusiness } from './system-main-three-element-group-tree.business';

@Component({
  selector: 'hw-system-main-three-element-group-tree',
  imports: [TreeComponent],
  templateUrl: './system-main-three-element-group-tree.component.html',
  styleUrl: './system-main-three-element-group-tree.component.less',
  providers: [SystemMainThreeElementGroupTreeBusiness],
})
export class SystemMainThreeElementGroupTreeComponent implements OnChanges {
  /**	全部地图元素（含楼栋/楼层），由 main 传入 */
  @Input() datas: GeoMapElement[] = [];
  /**	被隐藏（眼睛按钮）的点位 Id，用来决定眼睛图标的状态 */
  @Input() hiddenIds: ReadonlySet<string> = new Set<string>();

  /**	双击摄像机点位：播放实时视频预览（是否有权限由上层判断） */
  @Output() preview = new EventEmitter<GeoMapElement>();
  /**	显示/隐藏单个点位（地图上的 marker） */
  @Output() visible = new EventEmitter<GeoMapElement>();
  /**	分组节点的眼睛：一次性显示/隐藏该分组下的全部点位 */
  @Output() visibleAll = new EventEmitter<{ ids: string[]; visible: boolean }>();

  nodes: FlatTreeNode[] = [];

  /**	用户手动展开/折叠的节点（id → 展开状态），数据刷新后据此恢复 */
  private overrides = new Map<string, boolean>();
  /**	构建版本：异步取类型名称期间数据又变了，丢弃旧结果 */
  private version = 0;
  /**	元素叶子节点 id 集合（决定用单个还是分组操作） */
  private elementIds = new Set<string>();
  /**	分组节点 id → 该分组下全部点位的元素 Id */
  private groupElements = new Map<string, Set<string>>();

  constructor(
    private business: SystemMainThreeElementGroupTreeBusiness,
    private language: LanguageTool,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datas']) {
      this.build();
    } else if (changes['hiddenIds']) {
      /* 只切换眼睛/隐藏状态，不重建树（区域树不用重新拉取） */
      this.refresh();
    }
  }

  onToggle(node: FlatTreeNode): void {
    this.overrides.set(node.id, !!node.expanded);
  }

  /**	双击摄像机点位 → 播放视频预览 */
  onDblclick(node: FlatTreeNode): void {
    let element = node.data as GeoMapElement | undefined;
    if (!element?.Id) return;
    /* 只有与地图点位绑定的摄像机才可预览（分组节点、其他类型节点忽略） */
    if (element.ElementType != MapElementType.Camera) return;
    if (!element.ElementId) return;
    this.preview.emit(element);
  }

  onAction(e: { action: string; node: FlatTreeNode }): void {
    let element = e.node.data as GeoMapElement | undefined;
    switch (e.action) {
      case 'visible':
        if (this.elementIds.has(e.node.id)) {
          if (element?.Id) this.visible.emit(element);
        } else {
          /* 分组节点：全部隐藏时点一下全部显示，否则全部隐藏 */
          let ids = [...(this.groupElements.get(e.node.id) ?? [])];
          if (ids.length == 0) return;
          let visible = ids.every((x) => this.hiddenIds.has(x));
          this.visibleAll.emit({ ids, visible });
        }
        break;
      default:
        break;
    }
  }

  /**
   * 树结构：
   *   摄像机 → 摄像机分组（区域树） → 摄像机
   *   报警器 → 报警器
   *   传感器 → 传感器
   *   其他类型 → 该类型的点位
   * 楼栋/楼层不出类型根节点，也不出现在树里。
   */
  private async build(): Promise<void> {
    let version = ++this.version;
    let datas = this.datas ?? [];
    let groups = ArrayTool.groupBy(datas, (x) => x.ElementType);
    /* 楼栋/楼层不作为类型根节点 */
    let ignored = [MapElementType.Building, MapElementType.Floor];
    let types = Object.keys(groups)
      .map((x) => parseInt(x))
      .filter((x) => !ignored.includes(x))
      .sort((a, b) => a - b);

    let nodes: FlatTreeNode[] = [];
    for (const type of types) {
      let name = await this.language.geo.ElementType(type);
      if (!name) name = Language.MapElementType(type as MapElementType, `类型${type}`);

      let rootId = `type_${type}`;
      let icon = IconTool.MapElementType(type as MapElementType);
      nodes.push(this.groupNode(rootId, name, 0, undefined, icon, type, true));

      let items = this.sort(groups[type]);
      if (type == MapElementType.Camera) {
        await this.cameras(nodes, rootId, items);
      } else {
        for (const item of items) {
          nodes.push(this.elementNode(item, rootId, 1, icon));
        }
      }
    }

    if (version != this.version) return;

    this.index(nodes);
    for (const node of nodes) {
      if (!node.expandable) continue;
      let actions = this.groupActions(node.id);
      if (actions) node.actionsHtml = actions;
    }

    this.nodes = nodes;
    this.cdr.detectChanges();
  }

  /**	建立索引：元素叶子 id 集合、分组节点 → 其下全部点位 Id */
  private index(nodes: FlatTreeNode[]): void {
    this.elementIds = new Set<string>();
    this.groupElements = new Map<string, Set<string>>();
    let map = new Map(nodes.map((x) => [x.id, x]));

    for (const node of nodes) {
      if (!node.actionsHtml) continue;
      this.elementIds.add(node.id);
      let elementId = (node.data as GeoMapElement)?.Id;
      if (!elementId) continue;

      let parentId = node.parentId;
      while (parentId) {
        let ids = this.groupElements.get(parentId);
        if (!ids) {
          ids = new Set<string>();
          this.groupElements.set(parentId, ids);
        }
        ids.add(elementId);
        parentId = map.get(parentId)?.parentId;
      }
    }
  }

  /**	分组节点的眼睛按钮：全部隐藏时显示「显示全部」，否则「隐藏全部」 */
  private groupActions(id: string): string {
    let ids = this.groupElements.get(id);
    if (!ids || ids.size == 0) return '';
    let hidden = [...ids].every((x) => this.hiddenIds.has(x));
    let eye = hidden ? 'mdi mdi-eye-off' : 'mdi mdi-eye';
    let title = hidden ? '显示全部' : '隐藏全部';
    return `<div class="button hw-tree-action-btn hw-tree-action-visible ${hidden ? '' : 'primary'}" title="${title}">
        <i class="${eye}"></i>
      </div>`;
  }

  /**	眼睛状态变化：只刷新已有节点的按钮，不重新拉区域树 */
  private refresh(): void {
    for (const node of this.nodes) {
      if (this.elementIds.has(node.id)) {
        node.actionsHtml = this.actions(node.data as GeoMapElement);
      } else if (this.groupElements.has(node.id)) {
        node.actionsHtml = this.groupActions(node.id);
      }
    }
    /* 换引用触发 hw-tree 重新渲染（autoExpand=false，展开状态不受影响） */
    this.nodes = [...this.nodes];
    this.cdr.detectChanges();
  }

  /**
   * 摄像机按区域树分组（参考 TreeRegionBusiness）：
   * 区域结点按层级做分组节点，资源结点与地图点位按 Node.Id = ElementId 配对，
   * 配对上的摄像机显示为该区域下的叶子；没配对上的摄像机不显示。
   */
  private async cameras(
    nodes: FlatTreeNode[],
    rootId: string,
    items: GeoMapElement[],
  ): Promise<void> {
    let regions: RegionTreeNode[];
    try {
      regions = await this.business.region();
    } catch {
      /* 区域树取不到时不做分组（只显示配对上的点位，这里一个也配不上） */
      regions = [];
    }

    let elements = new Map<string, GeoMapElement>();
    for (const item of items) {
      if (item.ElementId) elements.set(item.ElementId, item);
    }

    let icon = IconTool.MapElementType(MapElementType.Camera);
    const add = (node: RegionTreeNode, parentId: string, level: number): void => {
      let children = this.regionSort(node.Children ?? []);
      /* 资源结点：与地图点位配对，配不上的不显示 */
      if (this.resource(node)) {
        let element = elements.get(node.Id);
        if (element) {
          nodes.push(this.elementNode(element, parentId, level, icon));
        }
        return;
      }
      /* 区域结点：子树里没有配对上的点位，整枝不显示 */
      if (!children.some((x) => this.matched(x, elements))) return;

      let id = `camera_group_${node.Id}`;
      nodes.push(
        this.groupNode(
          id,
          node.Name || node.Id,
          level,
          parentId,
          this.regionIcon(node.NodeType),
          node,
          /* 默认展开全部节点 */
          true,
        ),
      );
      for (const child of children) {
        add(child, id, level + 1);
      }
    };

    for (const region of regions) {
      add(region, rootId, 1);
    }
  }

  /**	资源结点（摄像机等设备资源）；其余为区域结点 */
  private resource(node: RegionTreeNode): boolean {
    return node.RegionNodeType == 2;
  }

  /**	该结点能否与地图点位配对（区域结点看子树） */
  private matched(node: RegionTreeNode, elements: Map<string, GeoMapElement>): boolean {
    if (this.resource(node)) return elements.has(node.Id);
    return (node.Children ?? []).some((x) => this.matched(x, elements));
  }

  /**	区域结点排序：资源在前，同类型按名称 */
  private regionSort(children: RegionTreeNode[]): RegionTreeNode[] {
    return [...children].sort((a, b) => {
      let order = this.order(a) - this.order(b);
      if (order != 0) return order;
      return LocaleCompare.compare(a.Name || a.Id, b.Name || b.Id);
    });
  }

  private order(node: RegionTreeNode): number {
    return this.resource(node) ? 0 : 1;
  }

  /**	区域图标：0-普通区域，1-楼栋，2-房屋单元（与 tree-region 一致） */
  private regionIcon(nodeType: number): string {
    switch (nodeType) {
      case 1:
        return 'howell-icon-view';
      case 2:
        return 'mdi mdi-vector-union';
      default:
        return 'mdi mdi-grid';
    }
  }

  /**	可展开的分组节点（类型根节点/摄像机分组） */
  private groupNode(
    id: string,
    label: string,
    level: number,
    parentId: string | undefined,
    icon: string,
    data: any,
    expanded: boolean,
  ): FlatTreeNode {
    return {
      id,
      label,
      level,
      parentId,
      expandable: true,
      expanded: this.overrides.has(id) ? this.overrides.get(id)! : expanded,
      icon,
      html: this.html(icon, label),
      data,
    };
  }

  /**	元素叶子节点：带定位 / 显示隐藏两个操作按钮 */
  private elementNode(
    element: GeoMapElement,
    parentId: string,
    level: number,
    icon: string,
  ): FlatTreeNode {
    return {
      /*	同一个点位可能在多个区域分组里出现，id 带上父节点，
          否则选中一处会把别处的同名节点一起选中 */
      id: `element_${parentId}_${element.Id}`,
      label: element.Name,
      level,
      parentId,
      expandable: false,
      expanded: false,
      icon,
      html: this.html(icon, element.Name),
      actionsHtml: this.actions(element),
      data: element,
    };
  }

  /**	节点操作按钮：显示隐藏 */
  private actions(element: GeoMapElement): string {
    let hidden = this.hiddenIds.has(element.Id);
    let eye = hidden ? 'mdi mdi-eye-off' : 'mdi mdi-eye';
    let title = hidden ? '显示' : '隐藏';
    return `<div class="button hw-tree-action-btn hw-tree-action-visible ${hidden ? '' : 'primary'}" title="${title}">
        <i class="${eye}"></i>
      </div>`;
  }

  private html(icon: string, label: string): string {
    return `<i class="hw-tree-icon ${icon}"></i><span class="hw-tree-label">${label}</span>`;
  }

  private sort(datas: GeoMapElement[]): GeoMapElement[] {
    return [...datas].sort((a, b) => {
      return LocaleCompare.compare(a.Name, b.Name);
    });
  }
}
