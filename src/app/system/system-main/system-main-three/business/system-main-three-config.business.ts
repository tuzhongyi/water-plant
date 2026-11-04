import { EventEmitter } from '@angular/core';
import { RenderMode } from '../../../../common/components/three-dimension/business/models/types';
import { ConfigRequestService } from '../../../../common/data-core/request/config/config-request.service';
import { LocalStorage } from '../../../../common/storage/local.storage';
import { ThreeDConfig } from '../../../../common/storage/three-d-storage/three-d-store.model';

export class SystemMainThreeConfigBusiness {
  static change = new EventEmitter<ThreeDConfig>();

  get change() {
    return SystemMainThreeConfigBusiness.change;
  }

  constructor(
    private config: ConfigRequestService,
    private local: LocalStorage,
  ) {}

  async load() {
    let storage = this.local.three_d.get();
    if (storage) {
      return storage;
    }
    storage = await this.config.map;
    this.save(storage);
    return storage;
  }

  save(info: ThreeDConfig) {
    /*	render 由 saveRenderMode 单独维护：各调用方手里是启动时读到的副本，
        整份覆盖会把它冲掉，这里以本地缓存为准 */
    let storage = this.local.three_d.get();
    if (storage?.render) {
      info.render = storage.render;
    }
    this.local.three_d.set(info);
    console.log(info);
    this.change.emit(info);
  }

  /**	是否显示绿植（场景中的树）：同步读取本地缓存，未配置时默认显示 */
  get tree(): boolean {
    return this.local.config.map.get().tree;
  }

  /**	渲染模式（同步读取本地缓存，供组件初始化时在创建模型前使用） */
  get renderMode(): RenderMode {
    switch (this.local.three_d.get()?.render?.mode) {
      case RenderMode.overlay:
        return RenderMode.overlay;
      case RenderMode.solid:
        return RenderMode.solid;
      default:
        return RenderMode.solid;
    }
  }

  /**	保存渲染模式：只改本地缓存里的 render，不整份覆盖其它 3D 配置 */
  saveRenderMode(mode: RenderMode) {
    let config = this.local.three_d.get();
    /* 本地还没有完整配置时不写，否则 config.load 会读到残缺对象 */
    if (!config) return;
    config.render = { mode: mode };
    this.local.three_d.set(config);
  }
}
