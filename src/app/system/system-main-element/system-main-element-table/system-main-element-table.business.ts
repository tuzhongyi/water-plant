import { Injectable } from '@angular/core';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { PagedList } from '../../../common/data-core/models/interface/page-list.model';
import { GetMapElementsParams } from '../../../common/data-core/request/services/geographic/geographic.params';
import { GeographicRequestService } from '../../../common/data-core/request/services/geographic/geographic.service';
import { ColorTool } from '../../../common/tools/color-tool/color.tool';
import { LanguageTool } from '../../../common/tools/language-tool/language.tool';
import {
  SystemMainElementTableArgs,
  SystemMainElementTableItem,
} from './system-main-element-table.model';

@Injectable()
export class SystemMainElementTableBusiness {
  constructor(
    private service: GeographicRequestService,
    private language: LanguageTool,
  ) {}

  async load(index: number, size: number, args: SystemMainElementTableArgs) {
    let datas = await this.data.load(index, size, args);

    if (datas.Page.PageCount > 0 && datas.Page.PageCount < index) {
      datas = await this.data.load(datas.Page.PageCount, size, args);
    }

    let paged = new PagedList<SystemMainElementTableItem<GeoMapElement>>();
    paged.Page = datas.Page;

    let all = datas.Data.map((x) => this.convert(x));
    paged.Data = await Promise.all(all);

    return paged;
  }

  private async convert(data: GeoMapElement) {
    let item: SystemMainElementTableItem<GeoMapElement> = {
      id: data.Id,
      name: data.Name,
      parent: data.ParentId ? (await this.data.get(data.ParentId)).Name : '',
      type: (await this.language.geo.ElementType(data.ElementType), ''),
      state: {
        name: (await this.language.geo.ElementStates(data.ElementState), ''),
        color: ColorTool.from.MapElementState(data.ElementState).hex,
      },
      data: data,
    };
    return item;
  }

  private data = {
    get: (id: string) => {
      return this.service.map.element.cache.get(id);
    },
    load: (index: number, size: number, args: SystemMainElementTableArgs) => {
      let params = new GetMapElementsParams();
      params.PageIndex = index;
      params.PageSize = size;

      if (args.name) {
        params.Name = args.name;
      }
      if (args.type != undefined) {
        params.ElementTypes = [args.type];
      }
      if (args.parent) {
        params.ParentId = args.parent;
      }

      return this.service.map.element.list(params);
    },
  };
}
