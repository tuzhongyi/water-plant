import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CardStatisticComponent } from '../../../../common/components/card-statistic/card-statistic.component';
import { InputIconComponent } from '../../../../common/components/input-icon/input-icon.component';
import { VideoChannel } from '../../../../common/data-core/models/devices/video-channel.model';
import { RegionTreeNode } from '../../../../common/data-core/models/regions/region-tree-node.model';
import { TreeRegionEditOutputArgs } from '../../../../share/tree/tree-region-edit/tree-region-edit.model';
import { TreeRegionArgs } from '../../../../share/tree/tree-region/tree-region.model';
import { SystemVideoDeviceListMultipleComponent } from '../system-video-device-list-multiple/system-video-device-list-multiple.component';
import { SystemVideoDeviceListArgs } from '../system-video-device-list/system-video-device-list.model';
import { SystemVideoDeviceRegionEditComponent } from '../system-video-device-region-edit/system-video-device-region-edit.component';
import { SystemVideoDeviceRegionConfigBusiness } from './system-video-device-region-config.business';

@Component({
  selector: 'hw-system-video-device-region-config',
  imports: [
    CommonModule,
    CardStatisticComponent,
    InputIconComponent,
    SystemVideoDeviceListMultipleComponent,
    SystemVideoDeviceRegionEditComponent,
  ],
  templateUrl: './system-video-device-region-config.component.html',
  styleUrl: './system-video-device-region-config.component.less',
  providers: [SystemVideoDeviceRegionConfigBusiness],
})
export class SystemVideoDeviceRegionConfigComponent {
  @Output() change = new EventEmitter<void>();
  constructor(
    private business: SystemVideoDeviceRegionConfigBusiness,
    private toastr: ToastrService,
  ) {}

  disabled = {
    input: signal<boolean>(true),
    output: signal<boolean>(true),
    change: () => {
      let disabled = true;
      if (!!this.region.selected && this.region.selected.RegionNodeType == 2) {
        disabled = false;
      }
      this.disabled.output.set(disabled);

      disabled = true;
      if (
        this.device.selected.length > 0 &&
        !!this.region.selected &&
        this.region.selected.RegionNodeType == 1
      ) {
        disabled = false;
      }
      this.disabled.input.set(disabled);
    },
  };

  region = {
    args: {} as TreeRegionArgs,
    load: new EventEmitter<TreeRegionArgs>(),
    /** 触发区域树重新加载（增删改 / 移入移出成功后） */
    reload: new EventEmitter<void>(),
    resources: [] as RegionTreeNode[],
    /** 资源 id → 所属区域 id（用于 output 移出资源） */
    parents: new Map<string, string>(),
    selected: undefined as RegionTreeNode | undefined,
    on: {
      search: () => {
        this.region.load.emit(this.region.args);
      },
      select: (data?: RegionTreeNode) => {
        this.disabled.change();
      },
      loaded: (roots: RegionTreeNode[]) => {
        const resources: RegionTreeNode[] = [];
        const parents = new Map<string, string>();
        const walk = (nodes: RegionTreeNode[], regionId?: string) => {
          for (const node of nodes) {
            if (node.RegionNodeType === 2) {
              resources.push(node);
              if (regionId) parents.set(node.Id, regionId);
            } else if (node.Children) {
              walk(node.Children, node.Id);
            }
          }
        };
        walk(roots);
        this.region.resources = resources;
        this.region.parents = parents;
        this.device.inverse = resources.map((x) => x.Id);
      },
      create: (result: TreeRegionEditOutputArgs) => {
        if (!result.value) {
          this.toastr.warning('名称不能为空');
          return;
        }
        // 无 data 为新增根节点
        const task = result.data
          ? this.business.region.create(
              { Id: result.data.Id, Sort: result.data.Sort },
              result.value,
            )
          : this.business.region.root(result.value);
        task
          .then(() => {
            this.region.reload.emit();
            this.toastr.success('操作成功');
            this.change.emit();
          })
          .catch((e) => {
            this.toastr.error('操作失败');
          });
      },
      update: (result: TreeRegionEditOutputArgs) => {
        if (!result.value) {
          this.toastr.warning('名称不能为空');
          return;
        }
        const node = result.data;
        if (!node) return;
        this.business.region
          .update(node.Id, result.value)
          .then(() => {
            this.region.reload.emit();
            this.toastr.success('操作成功');
            this.change.emit();
          })
          .catch((e) => {
            this.toastr.error('操作失败');
          });
      },
      delete: (result: TreeRegionEditOutputArgs) => {
        const node = result.data;
        if (!node) return;
        this.business.region.delete(node.Id).then(() => {
          this.region.reload.emit();
          this.toastr.success('操作成功');
          this.change.emit();
        });
      },
      output: () => {
        const resource = this.region.selected;
        if (!resource) return;
        const regionId = this.region.parents.get(resource.Id);
        if (!regionId) return;
        this.business.resource
          .delete(regionId, resource.Id)
          .then(() => {
            this.region.selected = undefined;
            this.region.reload.emit();
            this.toastr.success('操作成功');
            this.change.emit();
          })
          .finally(() => {
            this.disabled.change();
          });
      },
      input: async () => {
        if (this.region.selected) {
          let count = {
            success: 0,
            error: 0,
          };
          let successed: number[] = [];
          for (let i = 0; i < this.device.selected.length; i++) {
            try {
              const selected = this.device.selected[i];
              let result = await this.business.resource.create(this.region.selected, selected);

              this.device.selected.splice(i, 1);
              i--;
              count.success++;
            } catch (error) {
              count.error++;
            }
          }

          if (count.error > 0) {
            this.toastr.error(`操作失败${count.error}个`);
          }
          if (count.success > 0) {
            this.toastr.success(`操作成功${count.success}个`);
            this.region.reload.emit();
            this.change.emit();
          }
          this.disabled.change();
        }
      },
    },
  };
  device = {
    args: {} as SystemVideoDeviceListArgs,
    load: new EventEmitter<SystemVideoDeviceListArgs>(),
    datas: [] as VideoChannel[],
    inverse: [] as string[],
    selected: [] as VideoChannel[],
    on: {
      select: (datas: VideoChannel[]) => {
        this.disabled.change();
      },
      search: () => {
        this.device.load.emit(this.device.args);
      },
    },
  };
}
