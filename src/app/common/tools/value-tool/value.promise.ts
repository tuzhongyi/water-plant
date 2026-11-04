import { signal } from '@angular/core';
import { wait } from '../wait';

export class PromiseValue<T> {
  private _value?: T;

  private readonly _signal = signal<T | undefined>(undefined);
  /**	当前值的响应式引用，未设置时为 undefined，可在模板中直接读取 */
  readonly value = this._signal.asReadonly();

  get(): Promise<T> {
    return new Promise<T>((resolve) => {
      if (this._value) {
        resolve(this._value);
      } else {
        wait(() => {
          return !!this._value;
        }).then(() => {
          if (this._value) {
            resolve(this._value);
          }
        });
      }
    });
  }
  set(value: T): void {
    this._value = value;
    this._signal.set(value);
  }
  clear() {
    this._value = undefined;
    this._signal.set(undefined);
  }
  get existed(): boolean {
    return !!this._value;
  }
}
