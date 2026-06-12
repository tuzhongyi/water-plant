import { Injectable } from '@angular/core';
import { DeviceRequestService } from '../../data-core/request/services/device/device.service';

@Injectable({ providedIn: 'root' })
export class LanguageTool {
  constructor(private service: DeviceRequestService) {}

  DeviceState() {}
}
