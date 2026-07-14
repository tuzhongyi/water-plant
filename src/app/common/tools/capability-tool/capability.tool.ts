import { Injectable } from '@angular/core';
import { DB31RequestService } from '../../data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../data-core/request/services/device/device.service';
import { EventRequestService } from '../../data-core/request/services/event/event.service';
import { GeographicRequestService } from '../../data-core/request/services/geographic/geographic.service';
import { CapabilityDB31Tool } from './capability-db31.tool';
import { CapabilityDeviceTool } from './capability-device.tool';
import { CapabilityEventTool } from './capability-event.tool';
import { CapabilityGeographicTool } from './capability-geographic.tool';

@Injectable({ providedIn: 'root' })
export class CapabilityTool {
  device: CapabilityDeviceTool;
  db31: CapabilityDB31Tool;
  event: CapabilityEventTool;
  geographic: CapabilityGeographicTool;

  constructor(
    device: DeviceRequestService,
    db31: DB31RequestService,
    event: EventRequestService,
    geo: GeographicRequestService,
  ) {
    this.device = new CapabilityDeviceTool(device);
    this.db31 = new CapabilityDB31Tool(db31);
    this.event = new CapabilityEventTool(event);
    this.geographic = new CapabilityGeographicTool(geo);
  }
}
