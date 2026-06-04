import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

import { RoutePath } from '../../../../app.path';
import { LocalStorage } from '../../../storage/local.storage';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationActivate implements CanActivate {
  constructor(
    private local: LocalStorage,
    private router: Router,
  ) {}
  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    let url: string = state.url;
    if (url) {
      try {
        let auth = this.local.auth.get();
        if (this.local.auth.check(auth)) {
          return true;
        }
      } catch (error) {
        return this.router.parseUrl(`/${RoutePath.login}`);
      }
    }
    return this.router.parseUrl(`/${RoutePath.login}`);
  }
}
