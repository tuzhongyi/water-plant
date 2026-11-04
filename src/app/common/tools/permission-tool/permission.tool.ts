import { inject, Injectable } from '@angular/core';
import { UserPriority } from '../../data-core/enums/user-priority.enum';
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
    return this.global.user.group.existed;
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
}
