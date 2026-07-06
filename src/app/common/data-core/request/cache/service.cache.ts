import { ClassConstructor, plainToInstance } from 'class-transformer';

import { PagedList } from '../../models/interface/page-list.model';
import { IParams, PagedParams } from '../../models/interface/params.interface';
import { AppCache, IData, IService } from './cache.interface';

export class ServicePool {
  static [key: string]: AppCache;
}

export interface IServiceCache {
  cache: AppCache;
}

export class ServiceCache<T extends IData> implements IServiceCache {
  cache: AppCache;
  loaded = false;
  loading = false;

  private failed = {
    /** 记录 get(id) 请求失败的 ID → 失败时间戳，冷却期内不再重复请求 */
    ids: new Map<string, number>(),
    /** 失败 ID 的冷却时间（ms），默认 30 秒 */
    cooldown: 30_000,
    /** 正在进行的 get(id) 请求，避免同一 ID 并发发起多次 HTTP 请求 */
    pending: new Map<string, Promise<T>>(),
  };

  constructor(
    protected key: string,
    protected service: IService<T>,
    protected type?: ClassConstructor<T>,
    protected timeout = 1000 * 60 * 30,
    private init = true,
  ) {
    let cache = ServicePool[key];
    if (!cache) {
      cache = new AppCache(timeout);
      ServicePool[key] = cache;
    }
    this.cache = cache;
  }
  filter(datas: T[], args: IParams): T[] {
    return datas;
  }

  private doTimeout(time: number) {
    if (time < 0) time = 0;
    setTimeout(() => {
      this.loaded = false;
    }, time);
  }

  protected wait(resolve: (t: T[]) => void, timeout = 1, attempts = 0) {
    const maxAttempts = 300; // 最多等待 5 分钟 (300 × 1s)
    if (attempts >= maxAttempts) {
      console.error(`ServiceCache[${this.key}] wait timeout after ${maxAttempts} attempts`);
      this.loading = false;
      return;
    }
    setTimeout(() => {
      if (this.loaded) {
        let data = this.load();
        if (!data) {
          if (!this.loading) {
            if (this.init) {
              this.all()
                .then(() => {
                  this.doTimeout(this.timeout - 1000);
                })
                .catch(() => {
                  this.loading = false;
                });
            }
          }
          this.wait(resolve, timeout, attempts + 1);
          return;
        }
        resolve(data);
      } else {
        if (!this.loading) {
          if (this.init) {
            this.all()
              .then(() => {
                this.doTimeout(this.timeout - 1000);
              })
              .catch(() => {
                this.loading = false;
              });
          }
        }
        this.wait(resolve, timeout, attempts + 1);
      }
    }, timeout);
  }

  load() {
    return this.cache.get(this.key) as T[] | undefined;
  }
  save(data: T[]) {
    this.cache.set(this.key, data, this.timeout);
  }
  clear() {
    this.loading = false;
    this.loaded = false;
    this.failed.ids.clear();
    this.failed.pending.clear();
    this.cache.del(this.key);
  }

  list(args?: IParams): Promise<PagedList<T>> {
    return this.service.list!(args).then((result: PagedList<T>) => {
      if (!result?.Data) return result;
      let datas = this.load();
      if (this.type) {
        result.Data = plainToInstance(this.type, result.Data);
      }
      result.Data.forEach((item) => {
        if (!datas) datas = [];
        let index = datas.findIndex((x) => x.Id === item.Id);
        if (index >= 0) {
          datas[index] = item;
        } else {
          datas.push(item);
        }
      });
      return result;
    });
  }

  async all(params?: IParams): Promise<T[]> {
    this.loading = true;
    let datas = this.load();
    if (datas && datas.length > 0) {
      try {
        if (params) {
          return this.filter(datas, params);
        }
        return datas;
      } finally {
        this.loading = false;
      }
    }
    return this.service
      .all()
      .then((x) => {
        this.save(x);
        this.loaded = true;
        this.loading = false;
        return this.all(params);
      })
      .catch((err) => {
        this.loading = false;
        throw err;
      });
  }

  async get(id: string): Promise<T> {
    /* 先从缓存中查找，避免不必要的 HTTP 请求 */
    return this.all().then((datas) => {
      let index = datas.findIndex((x) => x.Id === id);
      if (index >= 0) {
        return datas[index];
      }

      /* 检查是否在失败冷却期内，避免短时间内重复请求已知会失败的 ID */
      const failedAt = this.failed.ids.get(id);
      if (failedAt !== undefined) {
        if (Date.now() - failedAt < this.failed.cooldown) {
          return Promise.reject(
            new Error(`ServiceCache[${this.key}] get("${id}") skipped: in failure cooldown`),
          );
        }
        /* 冷却期已过，移除记录允许重试 */
        this.failed.ids.delete(id);
      }

      /* 如果已有相同 ID 的请求正在飞行中，复用该 Promise，避免并发重复请求 */
      const pending = this.failed.pending.get(id);
      if (pending) {
        return pending;
      }

      /* 缓存中没有，请求服务端并更新缓存 */
      this.loading = true;
      const promise = this.service
        .get(id)
        .then((x) => {
          datas.push(x);
          this.save(datas);
          return x;
        })
        .catch((err) => {
          /* 记录失败的 ID，冷却期内不再请求 */
          this.failed.ids.set(id, Date.now());
          throw err;
        })
        .finally(() => {
          this.loading = false;
          this.failed.pending.delete(id);
        });

      /* 注册到 pendingGets，后续并发调用将复用同一个 Promise */
      this.failed.pending.set(id, promise);
      return promise;
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
    /* 使用 slice 而非 splice，避免破坏缓存中的原数组 */
    let paged = datas.slice(start, start + size);

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
