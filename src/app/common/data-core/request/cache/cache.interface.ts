import { IIdModel } from '../../models/interface/model.interface';
import { PagedList } from '../../models/interface/page-list.model';
import { IParams, PagedParams } from '../../models/interface/params.interface';
import { ServiceCache } from './service.cache';

export interface IData {
  Id: string;
}

export interface IService<T extends IIdModel> {
  cache: ServiceCache<T>;
  list: (params?: IParams, ...args: any[]) => Promise<PagedList<T>>;
  all: <P extends IParams>(params?: P, ...args: any[]) => Promise<T[]>;
  get: (id: string, ...args: any[]) => Promise<T>;
}
export abstract class AbstractService<T extends IIdModel> implements IService<T> {
  abstract list(params?: IParams, ...args: any[]): Promise<PagedList<T>>;
  abstract get(id: string, ...args: any[]): Promise<T>;

  async all(params: IParams = new PagedParams()) {
    let data: T[] = [];
    let index = 1;
    let paged: PagedList<T>;
    do {
      (params as PagedParams).PageIndex = index;
      paged = await this.list(params);
      data = data.concat(paged.Data);
      index++;
    } while (index <= paged.Page.PageCount);
    return data;
  }
}
export interface AbstractService<T extends IIdModel> {
  cache: ServiceCache<T>;
}

class AppCacheData {
  [key: string]: any;
}

export class AppCache {
  constructor(public timeout: number) {}
  private static data = new AppCacheData();

  private countdown(key: string, timeout: number) {
    setTimeout(() => {
      this.del(key);
    }, timeout);
  }

  // get(key: string) {
  //   let str = AppCache.data[key];
  //   if (str) {
  //     return JSON.parse(str);
  //   }
  //   return undefined;
  // }
  // set(key: string, value: any, timeout: number) {
  //   AppCache.data[key] = JSON.stringify(value);
  //   this.countdown(key, timeout);
  // }
  get(key: string) {
    return AppCache.data[key];
  }
  set(key: string, value: any, timeout: number) {
    AppCache.data[key] = value;
    this.countdown(key, timeout);
  }
  del(key: string) {
    delete AppCache.data[key];
  }
  reset() {
    AppCache.data = new AppCacheData();
  }
}

export interface ICreate<T> {
  create(data: T): Promise<T>;
}
export interface IUpdate<T> {
  update(data: T): Promise<T>;
}
export interface IDelete<T> {
  delete(id: string): Promise<T>;
}
