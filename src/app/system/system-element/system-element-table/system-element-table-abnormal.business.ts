import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { PagedList } from '../../../common/data-core/models/interface/page-list.model';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import {
  SystemElementTableFilter,
  SystemElementTableStateQuery,
} from './system-element-table.model';

/**	异常点位（离线 + 报警）：分两次查询后合并，再统一分页 */
export class SystemElementTableAbnormalBusiness {
  constructor(private geo: GeographicRequestService) {}

  async load(
    index: number,
    size: number,
    filter: SystemElementTableFilter,
    query: SystemElementTableStateQuery,
  ): Promise<PagedList<GeoMapElement>> {
    let elements = await this.all(filter, query);
    return PagedList.create(elements, index, size);
  }

  async building(
    index: number,
    size: number,
    buildingId: string,
    filter: SystemElementTableFilter,
    query: SystemElementTableStateQuery,
  ): Promise<PagedList<GeoMapElement>> {
    let floors = await query.floors(buildingId);
    let floorIds = new Set(floors.map((x) => x.Id));

    let elements = await this.all(filter, query);
    elements = elements.filter((x) => x.ParentId && floorIds.has(x.ParentId));

    return PagedList.create(elements, index, size);
  }

  /**	分别取离线和报警，合并去重（同一个点位不会同时属于两种状态） */
  private async all(
    filter: SystemElementTableFilter,
    query: SystemElementTableStateQuery,
  ): Promise<GeoMapElement[]> {
    let [offline, alarm] = await Promise.all([
      this.state(1, filter, query),
      this.state(2, filter, query),
    ]);

    let map = new Map<string, GeoMapElement>();
    for (const item of [...offline, ...alarm]) {
      map.set(item.Id, item);
    }
    return Array.from(map.values());
  }

  private async state(
    state: number,
    filter: SystemElementTableFilter,
    query: SystemElementTableStateQuery,
  ): Promise<GeoMapElement[]> {
    let params = await query.params(filter, state);
    if (!(await query.permission(params, filter))) {
      return [];
    }
    return query.filterCameras(await this.geo.map.element.all(params));
  }
}
