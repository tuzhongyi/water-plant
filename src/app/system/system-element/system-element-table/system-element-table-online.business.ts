import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { Page, PagedList } from '../../../common/data-core/models/interface/page-list.model';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import {
  SystemElementTableFilter,
  SystemElementTableStateQuery,
} from './system-element-table.model';

/**	在线点位：服务端按 ElementState=0 查询，分页由服务端完成 */
export class SystemElementTableOnlineBusiness {
  constructor(private geo: GeographicRequestService) {}

  async load(
    index: number,
    size: number,
    filter: SystemElementTableFilter,
    query: SystemElementTableStateQuery,
  ): Promise<PagedList<GeoMapElement>> {
    let params = await query.params(filter, 0);
    params.PageIndex = index;
    params.PageSize = size;

    if (!(await query.permission(params, filter))) {
      return this.empty(index, size);
    }

    let datas = await this.geo.map.element.list(params);
    datas.Data = await query.filterCameras(datas.Data);
    return datas;
  }

  async building(
    index: number,
    size: number,
    buildingId: string,
    filter: SystemElementTableFilter,
    query: SystemElementTableStateQuery,
  ): Promise<PagedList<GeoMapElement>> {
    let elements = await this.buildingAll(buildingId, filter, query);
    return PagedList.create(elements, index, size);
  }

  /**	建筑范围内的在线点位：先查出楼层下的全部在线点位，再按楼层过滤 */
  private async buildingAll(
    buildingId: string,
    filter: SystemElementTableFilter,
    query: SystemElementTableStateQuery,
  ): Promise<GeoMapElement[]> {
    let floors = await query.floors(buildingId);
    let floorIds = new Set(floors.map((x) => x.Id));

    let params = await query.params(filter, 0);
    if (!(await query.permission(params, filter))) {
      return [];
    }
    let elements = await query.filterCameras(await this.geo.map.element.all(params));
    return elements.filter((x) => x.ParentId && floorIds.has(x.ParentId));
  }

  private empty(index: number, size: number): PagedList<GeoMapElement> {
    let paged = new PagedList<GeoMapElement>();
    paged.Page = Page.create(index, size, 0);
    paged.Data = [];
    return paged;
  }
}
