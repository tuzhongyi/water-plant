import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import {
  CameraEntity,
  ModelTransformConfig,
  ModelViewerModel,
} from '../../../common/components/three-dimension/business/models/types';
import { ThreeDimensionComponent } from '../../../common/components/three-dimension/three-dimension.component';
import { VideoChannel } from '../../../common/data-core/models/devices/video-channel.model';
import { PathTool } from '../../../common/tools/path-tool/path.tool';
import { SystemMainThreeManagerBusiness } from './system-main-three-manager.business';

@Component({
  selector: 'hw-system-main-three-manager',
  imports: [CommonModule, ThreeDimensionComponent],
  templateUrl: './system-main-three-manager.html',
  styleUrl: './system-main-three-manager.less',
  providers: [SystemMainThreeManagerBusiness],
})
export class SystemMainThreeManager implements OnInit {
  @Output() modelClick = new EventEmitter<string>();
  @Output() modelHover = new EventEmitter<string | null>();
  @Output() modelDoubleClick = new EventEmitter<string>();
  @Output() preview = new EventEmitter<VideoChannel>();
  constructor(private business: SystemMainThreeManagerBusiness) {}
  ngOnInit(): void {}

  model = {
    datas: signal<ModelViewerModel[]>([]),
    focus: new EventEmitter<void>(),
    floor: {
      datas: [] as string[],
      selected: undefined as string | undefined,
      target: new EventEmitter<{ id: string; visibility: Record<string, boolean> }>(),
    },
    selected: {
      config: undefined as ModelTransformConfig | undefined,
    },
  };

  camera = {
    source: [] as VideoChannel[],
    datas: signal<CameraEntity[]>([]),

    load: async () => {
      this.camera.source = await this.business.camera.load();
      this.camera.source.length = 2;
      let entities = this.camera.source.map((x, i) => {
        let camera: CameraEntity = {
          id: x.Id,
          name: x.Name,
          position: { x: i * 10, y: i == 0 ? -25 : 0, z: 0 },
          modelId: i == 0 ? 'Administration_Complex_expansion.glb' : 'VIL.glb',
          meshId: i == 0 ? 'Floor1' : undefined,
        };
        return camera;
      });
      console.log(entities);
      this.camera.datas.set(entities);
    },
    on: {
      click: {
        dobule: (id: string) => {
          console.log('marker dblclick', id);
          let channel = this.camera.source.find((x) => x.Id == id);
          if (channel) {
            this.preview.emit(channel);
          }
        },
      },
    },
  };

  on = {
    floor: {
      back: () => {
        this.model.floor.datas = [];
        this.model.floor.selected = undefined;
        this.on.inited();
      },
      select: (index: number) => {
        this.model.floor.selected = this.model.floor.datas[index];
        if (this.model.selected.config) {
          let args = {
            id: this.model.selected.config.name ?? '',
            visibility: Object.fromEntries(
              this.model.floor.datas.map((key) => [key, this.model.floor.selected == key]),
            ) as Record<string, boolean>,
          };
          this.model.floor.target.emit(args);
          setTimeout(() => {
            this.model.focus.emit();
          }, 0);
        }
      },
    },
    loaded: (datas: ModelTransformConfig[]) => {
      console.log('loaded', datas);
      try {
        if (datas.length == 1) {
          let data = datas[0];
          if (data.name == 'Administration_Complex_expansion.glb') {
            if (data.meshVisibility) {
              this.model.floor.datas = Object.keys(data.meshVisibility);
              this.model.selected.config = data;
              return;
            }
          }
        }
        this.model.selected.config = undefined;
      } finally {
        this.model.focus.emit();
      }
    },
    inited: () => {
      console.log('inited');
      this.model.datas.set([
        {
          id: 'VIL.glb',
          url: PathTool.three.get.glb('VIL.glb'),
          fileName: 'VIL.glb',
        },
        {
          id: 'Administration_Complex.glb',
          url: PathTool.three.get.glb('Administration_Complex.glb'),
          fileName: 'Administration_Complex.glb',
        },
        // {
        //   id: 'Administration_Complex_expansion.glb',
        //   url: PathTool.three.get.glb('Administration_Complex_expansion.glb'),
        //   fileName: 'Administration_Complex_expansion.glb',
        // },
      ]);

      this.camera.load();
    },
    model: {
      click: (id: string) => {
        this.modelClick.emit(id);
      },
      hover: (id: string | null) => {
        this.modelHover.emit(id);
      },
      doubleClick: (id: string) => {
        this.modelDoubleClick.emit(id);
        if (id == 'Administration_Complex.glb') {
          this.model.datas.set([
            {
              id: 'Administration_Complex_expansion.glb',
              url: PathTool.three.get.glb('Administration_Complex_expansion.glb'),
              fileName: 'Administration_Complex_expansion.glb',
              position: { x: 0, y: 0, z: 0 },
            },
          ]);
        }
      },
    },
  };
}
