import { AuthorizationStore } from './authorization/authorization.store';

/**
 * 按用户名区分的本地缓存：
 * 同一个 key 下存 `{ [username]: value }`，不同用户的配置互不影响。
 */
export class UserStorage<T> {
  constructor(
    private key: string,
    private auth: AuthorizationStore,
  ) {}

  private get username(): string | undefined {
    let model = this.auth.get();
    return model?.username || undefined;
  }

  private read(): Record<string, T> {
    let str = localStorage.getItem(this.key);
    if (!str) {
      return {};
    }
    try {
      let model = JSON.parse(str);
      if (model && typeof model === 'object' && !Array.isArray(model)) {
        return model as Record<string, T>;
      }
    } catch {
      /*	旧版本可能存的是原始值而不是 JSON 对象，直接丢弃 */
    }
    return {};
  }

  private write(model: Record<string, T>) {
    localStorage.setItem(this.key, JSON.stringify(model));
  }

  get(): T | undefined {
    let username = this.username;
    if (!username) {
      return undefined;
    }
    return this.read()[username];
  }

  set(value: T) {
    /*	没有登录信息时不落盘，避免所有匿名数据挤在同一个空 key 上 */
    let username = this.username;
    if (!username) {
      return;
    }
    let model = this.read();
    model[username] = value;
    this.write(model);
  }

  /**	只清除当前用户的数据，其它用户的缓存保留 */
  clear() {
    let username = this.username;
    if (!username) {
      return;
    }
    let model = this.read();
    if (!(username in model)) {
      return;
    }
    delete model[username];
    if (Object.keys(model).length) {
      this.write(model);
    } else {
      localStorage.removeItem(this.key);
    }
  }
}
