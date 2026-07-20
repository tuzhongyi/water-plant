import { ConfigRequestService } from '../../../common/data-core/request/config/config-request.service';
import { LocalStorage } from '../../../common/storage/local.storage';
import { ThreeDConfig } from '../../../common/storage/three-d-storage/three-d-store.model';

export class SystemMainThreeConfigBusiness {
  constructor(
    private config: ConfigRequestService,
    private local: LocalStorage,
  ) {
    this.init();
  }

  async load() {
    let storage = this.local.three_d.get();
    if (storage) {
      return storage;
    }
    storage = await this.config.map;
    return storage;
  }

  private async init() {
    let info = await this.load();
    this.save(info);
  }

  save(info: ThreeDConfig) {
    this.local.three_d.set(info);
  }
}
