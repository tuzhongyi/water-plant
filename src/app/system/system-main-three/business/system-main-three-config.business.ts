import { EventEmitter } from '@angular/core';
import { ConfigRequestService } from '../../../common/data-core/request/config/config-request.service';
import { LocalStorage } from '../../../common/storage/local.storage';
import { ThreeDConfig } from '../../../common/storage/three-d-storage/three-d-store.model';

export class SystemMainThreeConfigBusiness {
  static change = new EventEmitter<ThreeDConfig>();

  get change() {
    return SystemMainThreeConfigBusiness.change;
  }

  constructor(
    private config: ConfigRequestService,
    private local: LocalStorage,
  ) {}

  async load() {
    let storage = this.local.three_d.get();
    if (storage) {
      return storage;
    }
    storage = await this.config.map;
    this.save(storage);
    return storage;
  }

  save(info: ThreeDConfig) {
    this.local.three_d.set(info);
    console.log(info);
    this.change.emit(info);
  }
}
