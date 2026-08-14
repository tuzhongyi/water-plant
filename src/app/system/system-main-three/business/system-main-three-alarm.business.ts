import { EventEmitter } from '@angular/core';
import { MapElementType } from '../../../common/data-core/enums/geo/map-element-type.enum';
import { GeoMapElement } from '../../../common/data-core/models/geographic/map-element.model';
import { ConfigRequestService } from '../../../common/data-core/request/config/config-request.service';
import { PromiseValue } from '../../../common/tools/value-tool/value.promise';
import { SystemMainThreeElementBusiness } from './system-main-three-element.business';
export class SystemMainThreeAlarmBusiness {
  constructor(
    private element: SystemMainThreeElementBusiness,
    config: ConfigRequestService,
  ) {
    config.get().then((x) => {
      let types = [MapElementType.Camera, MapElementType.Entrance, MapElementType.IoTSensor];
      if (x.alarm.autoclear) {
        types.push(MapElementType.Announciator);
      }
      this.types.set(types);
    });
  }

  discard = new EventEmitter<GeoMapElement>();

  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  /** 报警元素缓存，同时用于 has 查询和 discard 时获取完整数据 */
  private elements = new Map<string, GeoMapElement>();
  private types = new PromiseValue<MapElementType[]>();
  has(elementId: string): boolean {
    return this.elements.has(elementId);
  }

  /**
   * 添加报警：
   * 1. 场景缓存中找到且类型为摄像机 → 报警并 30s 消警
   * 2. 场景缓存中未找到 → 查数据库 → 找所在建筑：
   *    a. 设备是摄像机 → 缓存摄像机+建筑，30s 消警
   *    b. 设备非摄像机 → 建筑持续报警，不消警
   */
  async push(deviceId: string): Promise<GeoMapElement[]> {
    /* 先在场景缓存中查找 */
    const cached = this.element.from.device(deviceId);
    if (cached) {
      if ((await this.types.get()).includes(cached.ElementType)) {
        this.add(cached);
        return [cached];
      }
      return [];
    }

    /* 缓存未命中 → 查数据库 */
    const device = await this.element.get.by.elementId(deviceId);
    if (!device) return [];

    const building = await this.element.building.find(device);
    if (!building) return [];

    if ((await this.types.get()).includes(device.ElementType)) {
      /* 摄像机：设备和建筑都报警，30s 后消警 */
      this.add(device);
      this.add(building);
      return [device, building];
    } else {
      /* 非摄像机：检查建筑下所有 element，有 ElementState=2 则持续报警，否则清除 */
      const elements = await this.element.from.building(building.Id);
      const hasAlarm = elements.some((x) => x.ElementState == 2);
      if (hasAlarm) {
        this.elements.set(building.Id, building);
        return [building];
      } else {
        this.elements.delete(building.Id);
        return [];
      }
    }
  }

  /** 移除报警缓存并清除其定时器 */
  private remove(elementId: string) {
    const timer = this.timers.get(elementId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(elementId);
    }
    this.elements.delete(elementId);
  }

  /** 消警：移除指定元素的报警缓存，若所在建筑也处于报警则一并移除，返回被移除的建筑（用于恢复建筑颜色） */
  async unalarm(elementId: string): Promise<GeoMapElement | undefined> {
    const el = this.elements.get(elementId);
    if (!el) return undefined;

    this.remove(elementId);

    /* 所在建筑若也处于报警，一并清除并返回，供上层恢复建筑颜色 */
    const building = await this.element.building.find(el);
    if (building && this.elements.has(building.Id)) {
      this.remove(building.Id);
      return building;
    }
    return undefined;
  }

  /** 添加报警元素，30s 后自动消警 */
  private add(element: GeoMapElement) {
    const elementId = element.Id;
    this.elements.set(elementId, element);

    if (this.timers.has(elementId)) {
      clearTimeout(this.timers.get(elementId)!);
    }

    this.timers.set(
      elementId,
      setTimeout(() => {
        this.timers.delete(elementId);
        const el = this.elements.get(elementId);
        this.elements.delete(elementId);
        if (el) this.discard.emit(el);
      }, 30_000),
    );
  }
}
