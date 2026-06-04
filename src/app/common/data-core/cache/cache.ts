import { ClassConstructor } from 'class-transformer';
import { ServiceCache } from './service.cache';

export function Cache<T>(key: string, type?: ClassConstructor<T>) {
  return function (this: any, target: Function) {
    if (!target.prototype.cache) {
      Object.defineProperty(target.prototype, 'cache', {
        get() {
          if (!this._cache) {
            if (type) {
              switch (type.name) {
                // case AnalysisTask.name:
                //   this._cache = new AnalysisTaskCache(key, this);
                //   break;
                // case Road.name:
                //   this._cache = new RoadCache(key, this);
                //   break;
                // case ShopRegistration.name:
                //   this._cache = new ShopRegistrationCache(key, this);
                //   break;
                // case MobileDevice.name:
                //   this._cache = new SystemMobileDeviceCache(key, this);
                //   break;
                default:
                  this._cache = new ServiceCache(key, this);
                  break;
              }
            } else {
              this._cache = new ServiceCache(key, this);
            }
          }
          return this._cache;
        },
        set() {},
      });
    }
  };
}
