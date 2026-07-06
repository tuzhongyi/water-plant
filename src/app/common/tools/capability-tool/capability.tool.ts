import { Injectable } from '@angular/core';
import { DB31RequestService } from '../../data-core/request/services/db31/db31.service';
import { DeviceRequestService } from '../../data-core/request/services/device/device.service';
import { EventRequestService } from '../../data-core/request/services/event/event.service';
import { CapabilityDB31Tool } from './capability-db31.tool';
import { CapabilityDeviceTool } from './capability-device.tool';
import { CapabilityEventTool } from './capability-event.tool';

@Injectable({ providedIn: 'root' })
export class CapabilityTool {
  device: CapabilityDeviceTool;
  db31: CapabilityDB31Tool;
  event: CapabilityEventTool;

  constructor(device: DeviceRequestService, db31: DB31RequestService, event: EventRequestService) {
    this.device = new CapabilityDeviceTool(device);
    this.db31 = new CapabilityDB31Tool(db31);
    this.event = new CapabilityEventTool(event);
  }
}
