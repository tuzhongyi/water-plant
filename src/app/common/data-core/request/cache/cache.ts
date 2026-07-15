import { ClassConstructor } from 'class-transformer';
import { Device } from '../../models/devices/device.model';
import { GeoMapElement } from '../../models/geographic/map-element.model';
import { DeviceServiceCache } from '../services/device/device.cache';
import { GeographicMapElementServiceCache } from '../services/geographic/geographic-map-element.cache';
import { ServiceCache } from './service.cache';

export function Cache<T>(key: string, type?: ClassConstructor<T>) {
  return function (this: any, target: Function) {
    if (!target.prototype.cache) {
      // new ServiceCache(key, this);
      // console.log('Cache', this);
      Object.defineProperty(target.prototype, 'cache', {
        get() {
          if (!this._cache) {
            if (type) {
              switch (type.name) {
                case Device.name:
                  this._cache = new DeviceServiceCache(key, this);
                  break;
                case GeoMapElement.name:
                  this._cache = new GeographicMapElementServiceCache(key, this);
                  break;
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
      // target.prototype.cache = function () {
      //   console.log('cache', this);
      //   return;
      // };
    }
  };
}
