import { Injectable } from '@angular/core';

import { instanceToPlain } from 'class-transformer';
import { HowellResponse } from '../../../models/howell-response.model';
import { SecurityUrl } from '../../../urls/security/security.url';
import { HowellHttpClient } from '../howell-http.client';
import { HowellResponseProcess } from '../service-process';
import { SecurityUserRequestService } from './security-user.service';
import { UserAndPassword } from './security.params';

@Injectable({
  providedIn: 'root',
})
export class SecurityRequestService {
  constructor(private http: HowellHttpClient) {}

  login(params: UserAndPassword) {
    let url = SecurityUrl.login();
    let plain = instanceToPlain(params);
    return this.http.post<HowellResponse<string>, any>(url, plain).then((x) => {
      return HowellResponseProcess.data(x);
    });
  }

  private _user?: SecurityUserRequestService;
  public get user(): SecurityUserRequestService {
    if (!this._user) {
      this._user = new SecurityUserRequestService(this.http);
    }
    return this._user;
  }
}
