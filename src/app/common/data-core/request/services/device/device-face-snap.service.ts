import { instanceToPlain } from 'class-transformer';
import { ObjectTool } from '../../../../tools/object-tool/object.tool';

import { HowellResponse } from '../../../models/howell-response.model';
import { FaceSnapSettings } from '../../../models/xinneng/face-snap-settings.model';
import { DeviceUrl } from '../../../urls/device/device.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';

export class DeviceFaceRequestService {
  constructor(private http: HowellHttpClient) {}

  private _snap?: DeviceFaceSnapRequestService;
  public get snap(): DeviceFaceSnapRequestService {
    if (!this._snap) {
      this._snap = new DeviceFaceSnapRequestService(this.http);
    }
    return this._snap;
  }
}

class DeviceFaceSnapRequestService {
  constructor(private http: HowellHttpClient) {}

  setting = {
    get: () => {
      let url = DeviceUrl.face.snap.settings();
      return this.http.get<HowellResponse<FaceSnapSettings>>(url).then((x) => {
        return HowellResponseProcess.item(x, FaceSnapSettings);
      });
    },
    update: (data: FaceSnapSettings) => {
      let url = DeviceUrl.face.snap.settings();
      let _data = ObjectTool.serialize(data, FaceSnapSettings);
      let plain = instanceToPlain(_data);
      return this.http.put<any, HowellResponse<FaceSnapSettings>>(url, plain).then((x) => {
        return HowellResponseProcess.item(x, FaceSnapSettings);
      });
    },
  };
}
