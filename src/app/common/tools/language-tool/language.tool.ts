import { Injectable } from '@angular/core';
import { DB31RequestService } from '../../data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../data-core/request/services/device/device.service';
import { EventRequestService } from '../../data-core/request/services/event/event.service';
import { GeographicRequestService } from '../../data-core/request/services/geographic/geographic.service';
import { LanguageDB31Tool } from './language-db31.tool';
import { LanguageDeviceTool } from './language-device.tool';
import { LanguageEventTool } from './language-event.tool';
import { LanguageGeographicTool } from './language-geographic.tool';

@Injectable({ providedIn: 'root' })
export class LanguageTool {
  device: LanguageDeviceTool;
  db31: LanguageDB31Tool;
  event: LanguageEventTool;
  geo: LanguageGeographicTool;

  constructor(
    device: DeviceRequestService,
    db31: DB31RequestService,
    event: EventRequestService,
    geo: GeographicRequestService,
  ) {
    this.device = new LanguageDeviceTool(device);
    this.db31 = new LanguageDB31Tool(db31);
    this.event = new LanguageEventTool(event);
    this.geo = new LanguageGeographicTool(geo);
  }
}
