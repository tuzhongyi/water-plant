import { computed, inject, Injectable } from '@angular/core';
import { UserPriority } from '../../data-core/enums/user-priority.enum';
import { IdAndName } from '../../data-core/models/common/id-name.model';
import { GlobalStorage } from '../../storage/global.storage';

/**	当前登录用户的权限判断，读取的是 GlobalStorage.user.group（响应式）	*/
@Injectable({
  providedIn: 'root',
})
export class PermissionTool {
  private global = inject(GlobalStorage);

  /**	加载用户及权限组，重复调用只请求一次	*/
  load(): Promise<void> {
    return this.global.load();
  }

  /**	权限组是否已加载完成，未加载时不能判定权限	*/
  get loaded(): boolean {
    return !!this.global.user.group.value();
  }

  /**	根用户，拥有全部权限	*/
  get isRoot(): boolean {
    return this.global.user.group.value()?.IsRoot ?? false;
  }

  /**	是否拥有某项权限：权限组未加载时一律没有；根用户拥有全部权限	*/
  has(priority: UserPriority): boolean {
    let group = this.global.user.group.value();
    if (!group) {
      return false;
    }
    if (group.IsRoot) {
      return true;
    }
    return group.Priorities?.includes(priority) ?? false;
  }

  /**	响应式权限信号：权限是异步加载的，权限组回来之前一律为 false，加载完成后自动更新。
      组件里不要像普通布尔值一样在构造时读一次缓存起来（会永远停在 false），
      模板里直接绑定 permission.signals.playback() 这类信号即可；
      命令式代码需要最终值时用 await permission.load() 等待加载完成	*/
  readonly signals = {
    /** 权限组是否已加载完成 */
    ready: computed(() => !!this.global.user.group.value()),
    isRoot: computed(() => this.isRoot),
    preview: computed(() => this.preview),
    playback: computed(() => this.playback),
    download: computed(() => this.download),
    alarm: computed(() => this.alarm),
  };

  /**	用户有权限查看的视频通道 Id（通道未加载时为空集合）；
      按引用缓存集合，模板/列表里反复判断时不必每次重建	*/
  private channelCache?: { source?: IdAndName[]; ids: ReadonlySet<string> };
  get channels(): ReadonlySet<string> {
    let source = this.global.user.channels.value();
    let cache = this.channelCache;
    if (!cache || cache.source !== source) {
      cache = {
        source,
        ids: new Set((source ?? []).map((x) => this.channelKey(x.Id)).filter((x) => !!x)),
      };
      this.channelCache = cache;
    }
    return cache.ids;
  }

  /**	是否有权限查看指定视频通道（地图摄像机的 ElementId / 通道 Id）；
      根用户拥有全部通道权限，权限组/通道未加载时一律没有	*/
  canChannel(channelId?: string): boolean {
    let id = this.channelKey(channelId);
    if (!id) return false;
    if (this.isRoot) return true;
    return this.channels.has(id);
  }

  private channelKey(id?: string): string {
    return (id ?? '').trim().toLowerCase();
  }

  /**	视频预览	*/
  get preview(): boolean {
    return this.has(UserPriority.Preview);
  }
  /**	视频回放	*/
  get playback(): boolean {
    return this.has(UserPriority.Playback);
  }
  /**	视频下载	*/
  get download(): boolean {
    return this.has(UserPriority.Download);
  }
  /**	报警设置/控制	*/
  get alarm(): boolean {
    return this.has(UserPriority.Alarm);
  }
}
