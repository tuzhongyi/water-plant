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
  /**	搜索关键字：按节点名称过滤（空串显示全部） */
  @Input() query = '';

  /**	定位到点位所在位置（可能在建筑内） */
  @Output() position = new EventEmitter<GeoMapElement>();
  /**	双击摄像机点位：播放实时视频预览（是否有权限由上层判断） */
  @Output() preview = new EventEmitter<GeoMapElement>();
  /**	显示/隐藏单个点位（地图上的 marker） */
  @Output() visible = new EventEmitter<GeoMapElement>();
  /**	分组节点的眼睛：一次性显示/隐藏该分组下的全部点位 */
  @Output() visibleAll = new EventEmitter<{ ids: string[]; visible: boolean }>();

  nodes: FlatTreeNode[] = [];

  /**	完整树节点（未按搜索过滤）：搜索只改展示列表，不重建树、不重拉区域树 */
  private allNodes: FlatTreeNode[] = [];
  /**	用户手动展开/折叠的节点（id → 展开状态），数据刷新后据此恢复 */
  private overrides = new Map<string, boolean>();
  /**	分组的默认展开状态（id → expanded），清除搜索时用来还原 */
  private defaults = new Map<string, boolean>();
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
    /* 数据变化时整树重建（顺带覆盖搜索条件和眼睛状态） */
    if (changes['datas']) {
      this.build();
      return;
    }
    /* 只切换眼睛/隐藏状态，不重建树（区域树不用重新拉取） */
    if (changes['hiddenIds']) {
      this.refresh();
    }
    /* 搜索只按已有节点过滤，不重新构建（区域树不用重新拉取） */
    if (changes['query']) {
      this.apply();
    }
  }

  onToggle(node: FlatTreeNode): void {
    this.overrides.set(node.id, !!node.expanded);
  }

  /**	双击父节点展开/收缩；双击摄像机点位 → 播放视频预览 */
  onDblclick(node: FlatTreeNode): void {
    /* 分组节点：双击整行展开/收缩，和点箭头效果一致 */
    if (node.expandable) {
      node.expanded = !node.expanded;
      this.overrides.set(node.id, node.expanded);
      this.cdr.detectChanges();
      return;
    }

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
      case 'position':
        /*	不可见的点位不能定位（按钮已置灰，这里再兜一层） */
        if (!element?.Id) return;
        if (this.hiddenIds.has(element.Id)) return;
        this.position.emit(element);
        break;
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

    this.allNodes = nodes;
    this.index(nodes);
    for (const node of nodes) {
      if (!node.expandable) continue;
      let actions = this.groupActions(node.id);
      if (actions) node.actionsHtml = actions;
    }

    this.apply();
  }

  /**	展示列表：有关键字时按名称过滤，清空后还原完整树（展开状态一并还原） */
  private apply(): void {
    this.restore();
    let query = (this.query ?? '').trim().toLowerCase();
    let nodes = query ? this.screen(this.allNodes, query) : this.allNodes;
    /* 换引用触发 hw-tree 重新渲染（autoExpand=false，展开状态不受影响） */
    this.nodes = [...nodes];
    this.cdr.detectChanges();
  }

  /**	分组的展开状态：用户手动改过的优先，否则用默认值 */
  private restore(): void {
    for (const node of this.allNodes) {
      if (!node.expandable) continue;
      node.expanded = this.overrides.has(node.id)
        ? this.overrides.get(node.id)!
        : (this.defaults.get(node.id) ?? false);
    }
  }

  /**
   * 按名称过滤节点，呈现方式与 hw-tree-device 一致：
   *   命中的节点：其下全部节点都保留（跟平时展开看到的一样），
   *             下级也有命中才展开，否则这个节点是收缩的（区别只在收缩）；
   *   未命中的节点：下方有命中才保留，并展开露出命中的分支；
   *   叶子节点：名称命中、或祖先命中（整枝保留）才保留。
   * 只裁掉整棵子树，父节点保留则祖先链一定保留，层级 / parentId 不变。
   */
  private screen(nodes: FlatTreeNode[], query: string): FlatTreeNode[] {
    let children = new Map<string, FlatTreeNode[]>();
    for (const node of nodes) {
      if (!node.parentId) continue;
      let list = children.get(node.parentId);
      if (!list) {
        list = [];
        children.set(node.parentId, list);
      }
      list.push(node);
    }

    let kept = new Set<string>();
    /** @param forced 祖先是否命中：命中节点下的整枝都要保留 */
    let scan = (node: FlatTreeNode, forced: boolean): { hit: boolean; hitBelow: boolean } => {
      let self = this.match(node.label, query);
      let subs = children.get(node.id) ?? [];
      /* 没有下级：按叶子处理（空区域分组也是这种，靠自身或祖先命中保留） */
      if (subs.length == 0) {
        if (self || forced) kept.add(node.id);
        return { hit: self, hitBelow: false };
      }

      let results = subs.map((x) => scan(x, forced || self));
      let hitBelow = results.some((x) => x.hit || x.hitBelow);
      if (self || hitBelow || forced) {
        kept.add(node.id);
        if (self) {
          /* 命中节点：下级也有命中才展开，否则收缩（子节点仍在，展开即可看到） */
          node.expanded = hitBelow;
        } else if (!forced) {
          /* 被下级命中带出来的节点：展开露出命中分支 */
          node.expanded = true;
        }
      }
      return { hit: self, hitBelow };
    };

    for (const node of nodes) {
      if (!node.parentId) scan(node, false);
    }
    return nodes.filter((x) => kept.has(x.id));
  }

  private match(name: string | undefined, query: string): boolean {
    return (name ?? '').toLowerCase().includes(query);
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

  /**	眼睛状态变化：只刷新已有节点的按钮，不重新拉区域树
      （刷完整树：被搜索条件挡住、稍后又会显示出来的节点也要是最新状态） */
  private refresh(): void {
    for (const node of this.allNodes) {
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
   * 配对上的摄像机显示为该区域下的叶子；没配对上的摄像机挂在「未分组」下，
   * 区域树取不到时直接列在摄像机根节点下，保证摄像机不会整组消失。
   * 区域结点即使下面没有配上的摄像机也照样显示（只是不带展开箭头），
   * 这样刚建好的分组不会因为还没绑点位就看不见。
   */
  private async cameras(
    nodes: FlatTreeNode[],
    rootId: string,
    items: GeoMapElement[],
  ): Promise<void> {
    let regions: RegionTreeNode[] = [];
    try {
      regions = await this.business.region();
    } catch (error) {
      /* 区域树取不到时不做分组，但摄像机仍要显示，否则整组为空看不出原因 */
      console.error('[element-group] 区域树加载失败，摄像机不做区域分组', error);
    }

    let elements = new Map<string, GeoMapElement>();
    for (const item of items) {
      if (item.ElementId) elements.set(this.key(item.ElementId), item);
    }

    /* 已经挂到区域结点下的点位 Id（同一区域树里可能配对多次） */
    let placed = new Set<string>();
    /* 区域树里的资源 Id，配对不上时打到控制台，方便核对两边的 Id 口径 */
    let resources: string[] = [];
    let icon = IconTool.MapElementType(MapElementType.Camera);
    const add = (node: RegionTreeNode, parentId: string, level: number): void => {
      let children = this.regionSort(node.Children ?? []);
      /* 资源结点：与地图点位配对，配不上的不显示 */
      if (this.resource(node)) {
        resources.push(node.Id);
        let element = elements.get(this.key(node.Id));
        if (element) {
          placed.add(element.Id);
          nodes.push(this.elementNode(element, parentId, level, icon));
        }
        return;
      }
      /* 区域结点：即使子树里没有配上的摄像机也显示，没有可显示的子项时不带展开箭头 */
      let expandable = children.some((x) => this.matched(x, elements));

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
          expandable,
        ),
      );
      for (const child of children) {
        add(child, id, level + 1);
      }
    };

    for (const region of regions) {
      add(region, rootId, 1);
    }

    /* 没有绑定通道（ElementId 为空）、通道不在区域树里、区域树取不到的摄像机 */
    let rest = items.filter((x) => !placed.has(x.Id));
    if (rest.length == 0) return;
    if (regions.length == 0) {
      /* 区域树为空：直接列在摄像机根节点下 */
      for (const item of rest) {
        nodes.push(this.elementNode(item, rootId, 1, icon));
      }
      return;
    }
    let id = 'camera_group_unmatched';
    nodes.push(
      this.groupNode(id, '未分组', 1, rootId, 'mdi mdi-alert-circle-outline', undefined, true),
    );
    for (const item of rest) {
      nodes.push(this.elementNode(item, id, 2, icon));
    }
  }

  /**	资源结点（摄像机等设备资源）；其余为区域结点 */
  private resource(node: RegionTreeNode): boolean {
    return node.RegionNodeType == 2;
  }

  /**	配对用的 Id：两边都是 GUID，统一去空格、转小写，避免肉眼看不出的差异导致配不上 */
  private key(id?: string): string {
    return (id ?? '').trim().toLowerCase();
  }

  /**	该结点能否与地图点位配对（区域结点看子树） */
  private matched(node: RegionTreeNode, elements: Map<string, GeoMapElement>): boolean {
    if (this.resource(node)) return elements.has(this.key(node.Id));
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
    expandable = true,
  ): FlatTreeNode {
    this.defaults.set(id, expanded);
    return {
      id,
      label,
      level,
      parentId,
      expandable,
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

  /**	节点操作按钮：定位 / 显示隐藏 */
  private actions(element: GeoMapElement): string {
    let hidden = this.hiddenIds.has(element.Id);
    let eye = hidden ? 'mdi mdi-eye-off' : 'mdi mdi-eye';
    let title = hidden ? '显示' : '隐藏';
    /*	不可见的点位没有定位能力：按钮置灰，先点眼睛显示出来才能定位 */
    let position = hidden
      ? `<div class="button hw-tree-action-btn hw-tree-action-position disabled" title="点位不可见，无法定位">
          <i class="mdi mdi-map-marker"></i>
        </div>`
      : `<div class="button hw-tree-action-btn hw-tree-action-position primary" title="定位">
          <i class="mdi mdi-map-marker"></i>
        </div>`;
    return `${position}
      <div class="button hw-tree-action-btn hw-tree-action-visible ${hidden ? '' : 'primary'}" title="${title}">
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
