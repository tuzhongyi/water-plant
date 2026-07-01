import { firstValueFrom } from 'rxjs';
import { ApiConfigService } from '../../../common/components/three-dimension/business/services/api-config.service';

export class SettingMapModelBusiness {
  constructor(private service: ApiConfigService) {}

  load() {
    return firstValueFrom(this.service.models());
  }
}
