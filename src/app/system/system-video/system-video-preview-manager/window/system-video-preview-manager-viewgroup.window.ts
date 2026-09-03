import { WindowViewModel } from '../../../../common/components/window-control/window.model';
import { VideoChannelViewGroup } from '../../../../common/data-core/models/devices/video-channel-view-group.model';
import { SizeTool } from '../../../../common/tools/size-tool/size.tool';
import { SystemVideoPreviewManagerComponent } from '../system-video-preview-manager.component';

export class SystemVideoPreviewManagerViewGroupWindow {
  constructor(that: SystemVideoPreviewManagerComponent) {
    this.update = new UpdateWindow(that);
    this.delete = new DeleteWindow(that);
  }
  update: UpdateWindow;
  delete: DeleteWindow;
}

export class UpdateWindow extends WindowViewModel {
  constructor(private that: SystemVideoPreviewManagerComponent) {
    super();
  }
  style = { ...SizeTool.window.simple };
  title = '修改视频组名称';

  item?: VideoChannelViewGroup;
  name = '';

  on = {
    open: (item: VideoChannelViewGroup) => {
      this.item = item;
      this.name = item.Name;
      this.show.set(true);
    },
    ok: () => {
      if (this.item && this.name.trim()) {
        this.item.Name = this.name.trim();
        this.that.business.update(this.item).then(() => {
          this.that.viewgroup.load.emit();
          this.show.set(false);
        });
      }
    },
    cancel: () => {
      this.show.set(false);
    },
  };
}

export class DeleteWindow extends WindowViewModel {
  constructor(private that: SystemVideoPreviewManagerComponent) {
    super();
  }
  title = '删除视频组';
  content = '';
  item?: VideoChannelViewGroup;

  on = {
    open: (item: VideoChannelViewGroup) => {
      this.item = item;
      this.content = `确定删除视频组「${item.Name}」吗？`;
      this.show.set(true);
    },
    ok: async () => {
      if (this.item) {
        try {
          await this.that.business.delete(this.item.Id);
          this.that.viewgroup.load.emit();
          this.that.toastr.success('操作成功');
          this.show.set(false);
        } catch (error) {
          // 删除失败：保持弹窗打开，并提示错误
          this.that.toastr.error('操作失败');
        }
      }
    },
    cancel: () => {
      this.show.set(false);
    },
  };
}
