import { ClassConstructor } from 'class-transformer';
import { DB31Channel } from '../../models/db31/db31-channel.model';
import { DB31Device } from '../../models/db31/db31-device.model';
import { Device } from '../../models/devices/device.model';
import { VideoChannel } from '../../models/devices/video-channel.model';
import { GeoMapElement } from '../../models/geographic/map-element.model';
import { DB31ChannelServiceCache } from '../services/db31/channel/db31-channel.cache';
import { DB31DeviceServiceCache } from '../services/db31/device/db31-device.cache';
import { DeviceVideoChannelServiceCache } from '../services/device/device-video-channel.cache';
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
                case VideoChannel.name:
                  this._cache = new DeviceVideoChannelServiceCache(key, this);
                  break;
                case Device.name:
                  this._cache = new DeviceServiceCache(key, this);
                  break;
                case GeoMapElement.name:
                  this._cache = new GeographicMapElementServiceCache(key, this);
                  break;
                case DB31Device.name:
                  this._cache = new DB31DeviceServiceCache(key, this);
                  break;
                case DB31Channel.name:
                  this._cache = new DB31ChannelServiceCache(key, this);
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
