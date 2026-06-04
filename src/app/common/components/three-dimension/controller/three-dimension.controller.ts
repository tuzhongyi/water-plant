import { EventEmitter, HostListener, Injectable, NgZone } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/Addons.js';
import { EditInputs, ModelEntry } from './models/types';
import { ColorsService } from './services/colors.service';
import { ConfigService } from './services/config.service';
import { EdgesService } from './services/edges.service';
import { ModelService } from './services/model.service';
import { SceneService } from './services/scene.service';
import { StateService } from './services/state.service';

@Injectable()
export class ThreeDimensionController {
  modelClicked = new EventEmitter<string>();
  modelHovered = new EventEmitter<string | undefined>();
  transformChanged = new EventEmitter<EditInputs>();
  constructor(
    private toastr: ToastrService,
    private sceneService: SceneService,
    private state: StateService,
    private modelService: ModelService,
    private edgesService: EdgesService,
    private colorsService: ColorsService,
    private configService: ConfigService,
    private zone: NgZone,
  ) {}

  canvas?: HTMLCanvasElement;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private transformControls?: TransformControls;
  private editEntry?: ModelEntry;

  editMode = false;
  transformMode: 'translate' | 'rotate' | 'scale' = 'translate';

  async load(path: string, canvas: HTMLCanvasElement) {
    let container = canvas.parentElement as HTMLDivElement;
    this.sceneService.init(container, canvas);
    this.bindEvents(canvas);

    /* 加载配置（相机、渲染设置等），但不使用 autoLoadModels */
    const config = await this.configService.loadConfig();

    const fileName = path.substring(path.lastIndexOf('/') + 1);

    /* 检查配置中是否有该模型的 transform/render 参数 */
    const transform = config?.models?.[fileName];

    const entry = await this.modelService.loadModel(path, fileName, transform);
    if (entry) {
      /* 恢复材质颜色 */
      if (transform?.materialColors) {
        entry.materialColors.clear();
        for (const [matName, state] of Object.entries(transform.materialColors)) {
          entry.materialColors.set(matName, { ...state });
        }
      }

      /* 恢复 mesh 可见性 */
      if (transform?.meshVisibility) {
        entry.model.traverse((c) => {
          const m = c as THREE.Mesh;
          if (m.isMesh && m.name && transform.meshVisibility![m.name] !== undefined) {
            m.visible = transform.meshVisibility![m.name];
          }
        });
      }

      this.colorsService.applyStateColors(entry, 'normal');

      /* 应用渲染设置 */
      if (transform?.render) {
        entry.renderSettings = { ...transform.render };
        this.edgesService.createHardEdgesForEntry(entry);
        this.edgesService.applyRenderMode(entry, entry.renderSettings.renderMode ?? 'solid');
      }
    }
  }

  destroy() {
    this.sceneService.removeBeforeRender(this.tcUpdate);
    if (this.transformControls) {
      this.transformControls.detach();
      this.sceneService.overlayScene.remove(this.transformControls as any);
      this.transformControls.dispose();
    }
    this.sceneService.dispose();
  }

  private bindEvents(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      this.onPointerMove(e);
    });

    canvas.addEventListener('pointerdown', () => {
      /* 交给 OrbitControls 处理 */
    });

    canvas.addEventListener('click', (e: MouseEvent) => {
      this.onClick(e);
    });

    canvas.addEventListener('dblclick', (e: MouseEvent) => {
      this.onDoubleClick(e);
    });
  }

  @HostListener('document:keydown', ['$event'])
  private onKeyDown(e: KeyboardEvent): void {
    /* 避免在 input/textarea 中触发 */
    if (
      (e.target as HTMLElement)?.tagName === 'INPUT' ||
      (e.target as HTMLElement)?.tagName === 'TEXTAREA'
    )
      return;

    const entry = this.state.selectedEntry;
    if (!entry) return;

    switch (e.key.toLowerCase()) {
      case 'g':
        this.enterEditMode();
        break;
      case 'escape':
        this.exitEditMode();
        break;
      case 'delete':
      case 'backspace':
        this.modelService.removeModel(entry.id);
        break;
      case 'f':
        this.focusOnEntry(entry);
        break;
      case 'w':
        if (this.editMode) this.setTransformMode('translate');
        break;
      case 'e':
        if (this.editMode) this.setTransformMode('rotate');
        break;
      case 'r':
        if (this.editMode) this.setTransformMode('scale');
        break;
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    /* 编辑模式下跳过 hover 高亮逻辑 */
    if (this.state.editMode) return;

    this.raycaster.setFromCamera(this.mouse, this.sceneService.camera);
    const allEntries = Array.from(this.state.loadedModels.values()).filter((en) => en.visible);
    const meshes: THREE.Mesh[] = [];
    for (const entry of allEntries) {
      for (const mesh of this.edgesService.filterUserMeshes(entry)) {
        meshes.push(mesh);
      }
    }

    const hits = this.raycaster.intersectObjects(meshes, false);
    let newHovered: string | null = null;
    if (hits.length > 0) {
      const hit = hits[0].object;
      for (const entry of allEntries) {
        if (this.edgesService.filterUserMeshes(entry).includes(hit as THREE.Mesh)) {
          newHovered = entry.id;
          break;
        }
      }
    }

    const prev = this.state.hoveredModelId;
    if (prev !== newHovered) {
      if (prev) {
        const prevEntry = this.state.loadedModels.get(prev);
        if (prevEntry) {
          this.colorsService.applyStateColors(prevEntry, 'normal');
        }
      }
      if (newHovered) {
        const entry = this.state.loadedModels.get(newHovered);
        if (entry) {
          this.colorsService.applyStateColors(entry, 'hover');
        }
      }

      this.state.hoveredModelId$.next(newHovered);
      this.modelHovered.emit(newHovered ?? undefined);
      this.canvas.style.cursor = newHovered ? 'pointer' : '';
    }
  }

  private onClick(e: MouseEvent): void {
    this.raycaster.setFromCamera(this.mouse, this.sceneService.camera);
    const allEntries = Array.from(this.state.loadedModels.values()).filter((en) => en.visible);
    const meshes: THREE.Mesh[] = [];
    for (const entry of allEntries) {
      for (const mesh of this.edgesService.filterUserMeshes(entry)) {
        meshes.push(mesh);
      }
    }

    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      const hit = hits[0].object;
      for (const entry of allEntries) {
        if (this.edgesService.filterUserMeshes(entry).includes(hit as THREE.Mesh)) {
          this.selectEntry(entry);
          return;
        }
      }
    }
    this.deselectAll();
  }

  private onDoubleClick(e: MouseEvent): void {
    this.raycaster.setFromCamera(this.mouse, this.sceneService.camera);
    const allEntries = Array.from(this.state.loadedModels.values());
    const meshes: THREE.Mesh[] = [];
    for (const entry of allEntries) {
      for (const mesh of this.edgesService.filterUserMeshes(entry)) {
        meshes.push(mesh);
      }
    }

    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      for (const entry of allEntries) {
        if (this.edgesService.filterUserMeshes(entry).includes(hits[0].object as THREE.Mesh)) {
          this.focusOnEntry(entry);
          return;
        }
      }
    }
  }

  /* ---- 选择 / 包围盒 ---- */

  private selectEntry(entry: ModelEntry): void {
    /* 还原之前选中模型 */
    const prevId = this.state.selectedModelId;
    if (prevId && prevId !== entry.id) {
      const prevEntry = this.state.loadedModels.get(prevId);
      if (prevEntry) {
        this.colorsService.applyStateColors(prevEntry, 'normal');
      }
    }

    this.state.selectedModelId$.next(entry.id);
    this.modelClicked.emit(entry.id);

    /* 应用选中颜色 */
    this.colorsService.applyStateColors(entry, 'selected');

    /* 显示包围盒（如果全局开关开启） */
    if (this.state.showBBox) {
      this.showBBox(entry);
    }
  }

  private deselectAll(): void {
    const prevId = this.state.selectedModelId;
    if (prevId) {
      const prevEntry = this.state.loadedModels.get(prevId);
      if (prevEntry) {
        this.colorsService.applyStateColors(prevEntry, 'normal');
      }
    }
    this.hideAllBBox();
    this.state.selectedModelId$.next(null);
  }

  private showBBox(entry: ModelEntry): void {
    this.hideAllBBox();

    if (entry.bboxHelper) {
      /* 仅在已存在时更新并重新添加 */
    } else {
      const box = new THREE.Box3().setFromObject(entry.wrapper);
      const helper = new THREE.Box3Helper(box, new THREE.Color(0xff8800));
      helper.name = 'bboxHelper_' + entry.fileName;
      helper.renderOrder = 999;
      entry.bboxHelper = helper;
    }

    this.sceneService.scene.add(entry.bboxHelper);
  }

  private hideAllBBox(): void {
    for (const [, entry] of this.state.loadedModels) {
      if (entry.bboxHelper) {
        this.sceneService.scene.remove(entry.bboxHelper);
      }
    }
  }

  /* ---- 相机聚焦 ---- */

  private focusOnEntry(entry: ModelEntry): void {
    const bbox = new THREE.Box3().setFromObject(entry.wrapper);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 0.1);
    const dist = maxDim * 2.5;

    const dir = new THREE.Vector3()
      .subVectors(this.sceneService.camera.position, this.sceneService.controls.target)
      .normalize();

    this.sceneService.camera.position.copy(center.clone().addScaledVector(dir, dist));
    this.sceneService.controls.target.copy(center);
    this.sceneService.controls.update();
  }

  /* 每帧更新 transform controls gizmo */
  private tcUpdate = (): void => {
    if (this.transformControls) {
      (this.transformControls as any).update();
    }
  };

  /* ---- 编辑模式 ---- */

  private setTransformMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this.transformMode = mode;
    if (this.transformControls) {
      this.transformControls.setMode(mode);
    }
  }

  private enterEditMode(): void {
    const entry = this.state.selectedEntry;
    if (!entry) return;

    this.editEntry = entry;
    this.state.editMode$.next(true);

    this.zone.runOutsideAngular(() => {
      if (!this.transformControls) {
        this.transformControls = new TransformControls(
          this.sceneService.camera,
          this.sceneService.renderer.domElement,
        );
        (this.transformControls as any).size = 0.7;
        (this.transformControls as any).addEventListener('dragging-changed', (ev: any) => {
          this.sceneService.controls.enabled = !ev.value;
        });

        (this.transformControls as any).addEventListener('change', () => {
          if (!this.editEntry) return;
          const e = this.editEntry;
          const p = e.wrapper.position;
          const s = e.wrapper.scale;
          const r = e.wrapper.rotation;
          e.editPosition.copy(p);
          e.editScale.copy(s);
          e.editRotation.set(r.x, r.y, r.z);

          const inputs: EditInputs = {
            posX: p.x,
            posY: p.y,
            posZ: p.z,
            scaleX: s.x,
            scaleY: s.y,
            scaleZ: s.z,
            rotH: THREE.MathUtils.radToDeg(r.x),
            rotP: THREE.MathUtils.radToDeg(r.y),
            rotB: THREE.MathUtils.radToDeg(r.z),
          };
          this.state.updateEditInputs(inputs);
          this.transformChanged.emit(inputs);

          /* 更新包围盒 */
          this.zone.run(() => {
            if (this.state.showBBox && e.bboxHelper) {
              this.showBBox(e);
            }
          });
        });

        this.sceneService.overlayScene.add(this.transformControls as any);
      }

      this.sceneService.addBeforeRender(this.tcUpdate);
      this.transformControls.setMode(this.transformMode);
      this.transformControls.attach(entry.wrapper);
      (this.transformControls as any).update();
      /* attach 之后 gizmo 零件才被创建，确保渲染在最前 */
      (this.transformControls as any).traverse((c: any) => {
        if (c.material) {
          c.renderOrder = Infinity;
          c.material.depthTest = false;
          c.material.depthWrite = false;
        }
      });
    });

    /* 同步编辑面板初始值 */
    const p = entry.wrapper.position;
    const s = entry.wrapper.scale;
    const r = entry.wrapper.rotation;
    this.state.updateEditInputs({
      posX: p.x,
      posY: p.y,
      posZ: p.z,
      scaleX: s.x,
      scaleY: s.y,
      scaleZ: s.z,
      rotH: THREE.MathUtils.radToDeg(r.x),
      rotP: THREE.MathUtils.radToDeg(r.y),
      rotB: THREE.MathUtils.radToDeg(r.z),
    });
  }

  private exitEditMode(): void {
    this.sceneService.removeBeforeRender(this.tcUpdate);
    if (this.transformControls) {
      this.transformControls.detach();
    }
    this.sceneService.controls.enabled = true;
    this.editEntry = undefined;
    this.state.editMode$.next(false);
  }
}
