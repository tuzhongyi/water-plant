import { Injectable } from '@angular/core';
import { DB31RequestService } from '../../../common/data-core/request/services/db31/db31.service';

@Injectable()
export class SystemMainDB31Business {
  constructor(private service: DB31RequestService) {}

  load() {
    return this.service.device.cache.all();
  }
}
