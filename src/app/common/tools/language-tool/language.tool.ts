import { Injectable } from '@angular/core';
import { DB31RequestService } from '../../data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../data-core/request/services/device/device.service';
import { LanguageDB31Tool } from './language-db31.tool';
import { LanguageDeviceTool } from './language-device.tool';

@Injectable({ providedIn: 'root' })
export class LanguageTool {
  device: LanguageDeviceTool;
  db31: LanguageDB31Tool;

  constructor(device: DeviceRequestService, db31: DB31RequestService) {
    this.device = new LanguageDeviceTool(device);
    this.db31 = new LanguageDB31Tool(db31);
  }
}
