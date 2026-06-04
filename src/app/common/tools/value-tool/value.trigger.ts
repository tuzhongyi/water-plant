import { EventEmitter } from '@angular/core';

export abstract class TriggerValue<T> {
  constructor(value: T) {
    this._show = value;
  }
  private _show: T;
  get value() {
    return this._show;
  }
  set value(value: T) {
    if (this._show === value) return;
    this._show = value;
    this.change.emit(value);
  }
  change = new EventEmitter<T>();
}
