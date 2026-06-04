export abstract class AbstractUrl {
  constructor(base: string) {
    this._basic = base;
  }
  private _basic: string;
  basic(): string {
    return this._basic;
  }
  item<T = string>(id: T) {
    return `${this.basic()}/${id}`;
  }
  list() {
    return `${this.basic()}/List`;
  }
  location() {
    return `${this.basic()}/Locations`;
  }
}
