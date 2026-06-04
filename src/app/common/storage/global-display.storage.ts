import { EventEmitter } from '@angular/core';

export class GlobalDisplayStorage {
  change = new EventEmitter<IGlobalDisplay>();

  private value: IGlobalDisplay = {
    task: {
      shop: false,
      gps: false,
    },
    module: {
      shop: false,
      road: false,
      route: false,
    },
    record: {
      shop: false,
      realtime: false,
      gps: false,
    },
  };

  get() {
    return this.value;
  }

  set(value: IGlobalDisplay) {
    this.value = value;
    this.change.emit();
  }
}

interface ITaskDisplay {
  shop: boolean;
  gps: boolean;
}
interface IModuleDisplay {
  shop: boolean;
  road: boolean;
  route: boolean;
}
interface IRecordDisplay {
  shop: boolean;
  realtime: boolean;
  gps: boolean;
}

export interface IGlobalDisplay {
  task: ITaskDisplay;
  module: IModuleDisplay;
  record: IRecordDisplay;
}
