import { ClassConstructor } from 'class-transformer';

import { wait } from '../../tools/wait';
import { IIdModel } from '../models/interface/model.interface';
import { PagedList } from '../models/interface/page-list.model';
import { IParams, PagedParams } from '../models/interface/params.interface';
import { AppCache, IService } from './cache.interface';

export class ServicePool {
  static [key: string]: AppCache;
}

export interface IServiceCache {
  cache: AppCache;
}

export class ServiceCache<T extends IIdModel> implements IServiceCache {
  cache: AppCache;
  loading = false;

  constructor(
    protected key: string,
    protected service: IService<T>,
    protected type?: ClassConstructor<T>,
    protected timeout = 1000 * 60 * 30,
    private init = true
  ) {
    try {
      // console.log(key);
      let cache = ServicePool[key];
      if (!cache) {
        cache = new AppCache(timeout);
        ServicePool[key] = cache;
      }
      this.cache = cache;
    } catch (error) {
      console.error(error);
    }
    this.cache = new AppCache(timeout);
  }
  filter(datas: T[], args: IParams): T[] {
    return datas;
  }

  load() {
    return this.cache.get(this.key) as T[] | undefined;
  }
  save(data: T[]) {
    this.cache.set(this.key, data, this.timeout);
  }
  clear() {
    this.loading = false;
    this.cache.del(this.key);
  }

  all(...args: any): Promise<T[]> {
    return new Promise<T[]>((resolve) => {
      wait(() => {
        return this.loading === false;
      })
        .then(() => {
          let datas = this.load();
          if (datas && datas.length > 0) {
            resolve(datas);
          } else {
            this.loading = true;
            this.service
              .all()
              .then((datas) => {
                this.save([...datas]);
                resolve(datas);
              })
              .finally(() => {
                this.loading = false;
              });
          }
        })
        .catch(() => {
          console.error('ServiceCache all wait error');
        });
    });
  }

  paged(params: PagedParams): Promise<PagedList<T>> {
    return new Promise<PagedList<T>>((resolve) => {
      this.array(params).then((datas) => {
        let paged = this.getPaged(datas, params);
        resolve(paged);
      });
    });
  }

  async array(params: IParams): Promise<T[]> {
    return new Promise<T[]>((resolve) => {
      this.all().then((datas) => {
        datas = this.filter(datas, params);
        resolve(datas);
      });
    });
  }

  async get(id: string): Promise<T> {
    return new Promise<T>((resolve) => {
      this.all().then((datas) => {
        let index = datas.findIndex((x) => x.Id == id);
        if (index < 0) {
          this.loading = true;
          this.service
            .get(id)
            .then((data) => {
              datas.push(data);
              this.save(datas);
              resolve(data);
            })
            .finally(() => {
              this.loading = false;
            });
        } else {
          resolve(datas[index]);
        }
      });
    });
  }

  protected getPaged(datas: T[], params?: PagedParams): PagedList<T> {
    let index = 1;
    let size = 999;
    if (params) {
      if (params.PageIndex) {
        index = params.PageIndex;
      }
      if (params.PageSize) {
        size = params.PageSize;
      }
    }
    let count = datas.length;

    let start = (index - 1) * size;
    let paged = datas.splice(start, size);

    let page = {
      PageIndex: index,
      PageSize: size,
      PageCount: Math.ceil(count / size),
      RecordCount: paged.length,
      TotalRecordCount: count,
    };
    return {
      Page: page,
      Data: paged,
    };
  }
}
