import {
  Component, AfterViewInit, OnDestroy,
  inject, NgZone, signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { ModelViewerComponent } from '../model-viewer/model-viewer.component';
import { ControlComponent } from '../control/control.component';
import { SceneService } from '../../services/scene.service';
import { StateService } from '../../services/state.service';
import { ColorsService } from '../../services/colors.service';
import { ModelService } from '../../services/model.service';
import { ModelViewerModel, ModelEntry, SceneCamera } from '../../models/types';

@Component({
  selector: 'app-viewer-container',
  standalone: true,
  imports: [ModelViewerComponent, ControlComponent],
  template: `
    <app-model-viewer
      [models]="viewerModels()"
      [sceneCameras]="sceneCameras()"
      [activeCameraId]="activeCameraId()"
      [showBBox]="showBBox()"
      (modelClick)="onModelClick($event)"
      (modelHover)="onModelHover($event)"
      (modelDoubleClick)="onModelDoubleClick($event)"
      (cameraClick)="onCameraClick($event)"
      (blankClick)="onBlankClick()"
      (keyEvent)="onKeyEvent($event)"
    />

    @if (activeCameraId()) {
      <div class="help-card cam-help">
        <div class="help-title">摄像机操控</div>
        <div class="help-row"><kbd>W</kbd> 前进</div>
        <div class="help-row"><kbd>S</kbd> 后退</div>
        <div class="help-row"><kbd>A</kbd> 左移</div>
        <div class="help-row"><kbd>D</kbd> 右移</div>
        <div class="help-row">鼠标左键 旋转</div>
        <div class="help-row">鼠标右键 平移</div>
      </div>
    }

    @if (editMode() && editEntryGroup()) {
      <div class="help-card">
        <div class="help-title">变换操作</div>
        <div class="help-row"><kbd>W</kbd> 平移</div>
        <div class="help-row"><kbd>E</kbd> 旋转</div>
        <div class="help-row"><kbd>R</kbd> 缩放</div>
        <div class="help-row"><kbd>Esc</kbd> 退出</div>
        <div class="help-row"><kbd>F</kbd> 聚焦</div>
        <div class="help-row"><kbd>Del</kbd> 删除</div>
      </div>
      <div class="transform-toolbar">
        <button [class.active]="transformMode() === 'translate'"
                (click)="onModeChange('translate')" title="平移 (W)">平移</button>
        <button [class.active]="transformMode() === 'rotate'"
                (click)="onModeChange('rotate')" title="旋转 (E)">旋转</button>
        <button [class.active]="transformMode() === 'scale'"
                (click)="onModeChange('scale')" title="缩放 (R)">缩放</button>
      </div>
      <app-control
        [camera]="viewerCamera"
        [rendererDomElement]="viewerRendererDomElement"
        [controls]="viewerControls"
        [overlayScene]="viewerOverlayScene"
        [editEntryGroup]="editEntryGroup()!"
        [transformMode]="transformMode()"
        (modeChange)="onModeChange($event)"
        (transformChange)="onTransformChange($event)"
      />
    }
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; position: relative; }
    .help-card {
      position: absolute; top: 8px; left: 8px;
      background: rgba(10, 26, 29, 0.9); border: 1px solid #173438;
      border-radius: 4px; padding: 8px 12px; z-index: 10;
      color: #aaa; font-size: 11px; min-width: 140px;
    }
    .cam-help { top: 8px; z-index: 11; }
    .help-title { color: #17f1c6; font-weight: bold; margin-bottom: 4px; font-size: 12px; }
    .help-row { display: flex; align-items: center; gap: 6px; margin: 2px 0; }
    kbd {
      background: #0f2529; border: 1px solid #1f4a52;
      border-radius: 2px; padding: 0 4px; font-size: 10px;
      color: #ddd; font-family: inherit; min-width: 22px; text-align: center;
    }
    .transform-toolbar {
      position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 4px; background: rgba(10, 26, 29, 0.9); border: 1px solid #173438;
      border-radius: 4px; padding: 4px; z-index: 10;
    }
    .transform-toolbar button {
      background: #0f2529; color: #aaa; border: 1px solid #1b3f46;
      padding: 4px 12px; border-radius: 3px; cursor: pointer; font-size: 12px;
    }
    .transform-toolbar button:hover { background: #14353f; color: #ddd; }
    .transform-toolbar button.active { background: #07a990; color: #fff; border-color: #07a990; }
  `],
})
export class ViewerContainerComponent implements AfterViewInit, OnDestroy {
  /* ---- Services ---- */
  private zone = inject(NgZone);
  private sceneService = inject(SceneService);
  private state = inject(StateService);
  private colorsService = inject(ColorsService);
  private modelService = inject(ModelService);

  /* ---- Data signals (derived from StateService) ---- */
  readonly viewerModels = signal<ModelViewerModel[]>([]);
  readonly sceneCameras = signal<SceneCamera[]>([]);
  readonly activeCameraId = signal<string | null>(null);
  readonly showBBox = signal<boolean>(false);

  /* ---- Edit state ---- */
  readonly editMode = signal(false);
  readonly editEntryGroup = signal<THREE.Group | null>(null);
  readonly transformMode = signal<'translate' | 'rotate' | 'scale'>('translate');

  /* ---- Scene references (available after ngAfterViewInit) ---- */
  viewerCamera!: THREE.PerspectiveCamera;
  viewerRendererDomElement!: HTMLCanvasElement;
  viewerControls!: any;
  viewerOverlayScene!: THREE.Scene;

  /* ---- Internal state ---- */
  private mEditEntry?: ModelEntry;
  private cameraEditEntry?: SceneCamera;
  private cameraTransformControls?: TransformControls;
  private subs = new Subscription();

  ngAfterViewInit(): void {
    this.viewerCamera = this.sceneService.camera as THREE.PerspectiveCamera;
    this.viewerRendererDomElement = this.sceneService.renderer.domElement;
    this.viewerControls = this.sceneService.controls;
    this.viewerOverlayScene = this.sceneService.overlayScene;

    this.bindSubscriptions();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.cameraTransformControls) {
      this.cameraTransformControls.detach();
      this.sceneService.overlayScene.remove(this.cameraTransformControls.getHelper());
      this.cameraTransformControls.dispose();
    }
  }

  /* ================================================================ */
  /*  状态订阅                                                        */
  /* ================================================================ */

  private bindSubscriptions(): void {
    this.subs.add(this.state.loadedModelList$.subscribe(entries => {
      this.viewerModels.set(entries.map(e => ({
        id: e.id,
        group: e.wrapper,
        fileName: e.fileName,
        locked: e.locked,
      })));
    }));

    this.subs.add(this.state.sceneCameras$.subscribe(cams => {
      this.sceneCameras.set(cams);
    }));

    this.subs.add(this.state.activeSceneCameraId$.subscribe(id => {
      this.activeCameraId.set(id);
    }));

    this.subs.add(this.state.settings$.subscribe(s => {
      this.showBBox.set(s.showBBox);
    }));

    this.subs.add(this.state.editMode$.subscribe(v => {
      this.editMode.set(v);
    }));

    this.subs.add(this.state.selectedModelId$.subscribe(id => {
      if (id) {
        const entry = this.state.loadedModels.get(id);
        if (entry && this.mEditEntry?.id !== id) {
          if (this.mEditEntry) this.doExitModelEdit();
          this.doEnterModelEdit(entry);
        }
      } else {
        if (this.mEditEntry) this.doExitModelEdit();
      }
    }));

    this.subs.add(this.state.selectedSceneCameraId$.subscribe(id => {
      if (this.cameraEditEntry && this.cameraEditEntry.id !== id) {
        this.exitCameraEditMode();
      }

      for (const cam of this.state.sceneCameras) {
        this.applyCameraColor(cam, cam.id === id ? 'selected' : 'normal');
      }

      if (id && !this.state.selectedModelId && this.cameraEditEntry?.id !== id) {
        const sceneCam = this.state.sceneCameras.find(c => c.id === id);
        if (sceneCam) this.enterCameraEditMode(sceneCam);
      }

      if (!id && this.cameraEditEntry) {
        this.exitCameraEditMode();
      }
    }));

    this.subs.add(this.state.editInputs$.subscribe(() => {
      const entry = this.state.selectedEntry;
      if (!entry || !this.mEditEntry) return;
      this.modelService.applyTransform(entry);
    }));
  }

  /* ================================================================ */
  /*  模型点击/悬停                                                   */
  /* ================================================================ */

  onModelClick(id: string): void {
    if (!id) { this.onBlankClick(); return; }
    const entry = this.state.loadedModels.get(id);
    if (!entry || entry.locked) return;

    this.deselectCamera();
    this.selectModel(entry);
  }

  onModelHover(id: string | null): void {
    const prevId = this.state.hoveredModelId;
    if (prevId === id) return;

    if (prevId && prevId !== this.state.selectedModelId) {
      const prevEntry = this.state.loadedModels.get(prevId);
      if (prevEntry) this.colorsService.applyStateColors(prevEntry, 'normal');
    }
    if (id && id !== this.state.selectedModelId) {
      const entry = this.state.loadedModels.get(id);
      if (entry) this.colorsService.applyStateColors(entry, 'hover');
    }
    this.state.hoveredModelId$.next(id);
  }

  onModelDoubleClick(id: string): void {
    const entry = this.state.loadedModels.get(id);
    if (!entry) return;
    this.focusOnEntry(entry);
  }

  onCameraClick(id: string): void {
    this.deselectModel();
    this.state.selectedSceneCameraId$.next(id);
  }

  onBlankClick(): void {
    this.deselectModel();
    this.deselectCamera();
  }

  /* ================================================================ */
  /*  键盘事件                                                        */
  /* ================================================================ */

  onKeyEvent(ev: { type: 'down' | 'up'; key: string }): void {
    if (ev.type === 'up') return;

    const key = ev.key;
    const entry = this.state.selectedEntry;

    if (!entry) {
      if (key === 'g') {
        const selectedCamId = this.state.selectedSceneCameraId$.value;
        if (selectedCamId) {
          const sceneCam = this.state.sceneCameras.find(c => c.id === selectedCamId);
          if (sceneCam) this.enterCameraEditMode(sceneCam);
        }
      } else if (key === 'escape') {
        this.exitCameraEditMode();
      }
      return;
    }

    switch (key) {
      case 'g': this.doEnterModelEdit(entry); break;
      case 'escape':
        if (this.cameraEditEntry) this.exitCameraEditMode();
        else this.doExitModelEdit();
        break;
      case 'delete': case 'backspace': this.modelService.removeModel(entry.id); break;
      case 'f': this.focusOnEntry(entry); break;
      case 'w': if (this.editMode()) this.transformMode.set('translate'); break;
      case 'e': if (this.editMode()) this.transformMode.set('rotate'); break;
      case 'r': if (this.editMode()) this.transformMode.set('scale'); break;
    }
  }

  /* ================================================================ */
  /*  变换工具栏                                                      */
  /* ================================================================ */

  onModeChange(mode: 'translate' | 'rotate' | 'scale'): void {
    this.transformMode.set(mode);
  }

  onTransformChange(ev: { pos: THREE.Vector3; scl: THREE.Vector3; rot: THREE.Euler }): void {
    if (!this.mEditEntry) return;
    const e = this.mEditEntry;
    e.editPosition.copy(ev.pos);
    e.editScale.copy(ev.scl);
    e.editRotation.set(ev.rot.x, ev.rot.y, ev.rot.z);
    this.state.updateEditInputs({
      posX: ev.pos.x, posY: ev.pos.y, posZ: ev.pos.z,
      scaleX: ev.scl.x, scaleY: ev.scl.y, scaleZ: ev.scl.z,
      rotH: THREE.MathUtils.radToDeg(ev.rot.x),
      rotP: THREE.MathUtils.radToDeg(ev.rot.y),
      rotB: THREE.MathUtils.radToDeg(ev.rot.z),
    });
    this.modelService.updateBBox(e);
    if (this.state.settings.showBBox && e.bboxHelper) {
      this.showModelBBox(e);
    }
  }

  /* ================================================================ */
  /*  选择/取消选择                                                   */
  /* ================================================================ */

  private selectModel(entry: ModelEntry): void {
    const prevId = this.state.selectedModelId;
    if (prevId && prevId !== entry.id) {
      const prevEntry = this.state.loadedModels.get(prevId);
      if (prevEntry) this.colorsService.applyStateColors(prevEntry, 'normal');
    }
    this.state.selectedModelId$.next(entry.id);
    this.colorsService.applyStateColors(entry, 'selected');
    if (this.state.settings.showBBox) this.showModelBBox(entry);
  }

  private deselectModel(): void {
    const prevId = this.state.selectedModelId;
    if (prevId) {
      const prevEntry = this.state.loadedModels.get(prevId);
      if (prevEntry) this.colorsService.applyStateColors(prevEntry, 'normal');
    }
    this.state.selectedModelId$.next(null);
  }

  private deselectCamera(): void {
    this.state.selectedSceneCameraId$.next(null);
  }

  /* ================================================================ */
  /*  聚焦                                                            */
  /* ================================================================ */

  private focusOnEntry(entry: ModelEntry): void {
    const bbox = new THREE.Box3().setFromObject(entry.wrapper);
    const center = new THREE.Vector3(); bbox.getCenter(center);
    const size = new THREE.Vector3(); bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z, 0.1);
    const dist = maxDim * 2.5;
    const cam = this.sceneService.camera;
    const ctrl = this.sceneService.controls;
    const dir = new THREE.Vector3().subVectors(cam.position, ctrl.target).normalize();
    cam.position.copy(center.clone().addScaledVector(dir, dist));
    ctrl.target.copy(center);
    ctrl.update();
  }

  /* ================================================================ */
  /*  包围盒                                                          */
  /* ================================================================ */

  private showModelBBox(entry: ModelEntry): void {
    if (entry.bboxHelper) {
      this.sceneService.scene.remove(entry.bboxHelper);
      entry.bboxHelper.dispose();
      entry.bboxHelper = undefined;
    }
    const box = new THREE.Box3().setFromObject(entry.wrapper);
    const helper = new THREE.Box3Helper(box, new THREE.Color(0xff8800));
    helper.name = 'bboxHelper_' + entry.fileName;
    helper.renderOrder = 999;
    entry.bboxHelper = helper;
    this.sceneService.scene.add(helper);
  }

  /* ================================================================ */
  /*  模型编辑模式                                                    */
  /* ================================================================ */

  private doEnterModelEdit(entry: ModelEntry): void {
    if (this.mEditEntry?.id === entry.id) return;

    if (this.cameraEditEntry) this.exitCameraEditMode();
    this.mEditEntry = entry;
    this.state.editMode$.next(true);
    this.editEditEntryGroup(entry);
    this.syncEditInputs(entry);
  }

  private doExitModelEdit(): void {
    this.mEditEntry = undefined;
    this.editMode.set(false);
    this.editEntryGroup.set(null);
    this.state.editMode$.next(false);
  }

  private editEditEntryGroup(entry: ModelEntry): void {
    this.editMode.set(true);
    this.editEntryGroup.set(entry.wrapper);
  }

  private syncEditInputs(entry: ModelEntry): void {
    const p = entry.wrapper.position;
    const s = entry.wrapper.scale;
    const r = entry.wrapper.rotation;
    this.state.updateEditInputs({
      posX: p.x, posY: p.y, posZ: p.z,
      scaleX: s.x, scaleY: s.y, scaleZ: s.z,
      rotH: THREE.MathUtils.radToDeg(r.x),
      rotP: THREE.MathUtils.radToDeg(r.y),
      rotB: THREE.MathUtils.radToDeg(r.z),
    });
  }

  /* ================================================================ */
  /*  摄像机颜色                                                      */
  /* ================================================================ */

  private applyCameraColor(cam: SceneCamera, state: 'normal' | 'hover' | 'selected'): void {
    const c = cam.colors[state];
    const e = state === 'normal' ? 0.4 : state === 'hover' ? 0.7 : 0.6;
    cam.bodyMat.color.set(c.body); cam.bodyMat.emissive.set(c.body); cam.bodyMat.emissiveIntensity = e;
    cam.lensMat.color.set(c.lens); cam.lensMat.emissive.set(c.lens);
    cam.lensMat.emissiveIntensity = state === 'normal' ? 0.2 : 0.4;
    cam.vfMat.color.set(c.viewfinder); cam.vfMat.emissive.set(c.viewfinder);
    cam.vfMat.emissiveIntensity = state === 'normal' ? 0.2 : 0.4;
  }

  /* ================================================================ */
  /*  摄像机 TransformControls                                        */
  /* ================================================================ */

  private initCameraTransformControls(): void {
    if (this.cameraTransformControls) return;
    this.cameraTransformControls = new TransformControls(
      this.sceneService.camera, this.sceneService.renderer.domElement
    );
    (this.cameraTransformControls as any).size = 0.7;
    (this.cameraTransformControls as any).addEventListener('dragging-changed', (ev: any) => {
      if (this.state.activeSceneCameraId$.value) return;
      this.sceneService.controls.enabled = !ev.value;
    });
    (this.cameraTransformControls as any).addEventListener('change', () => {
      if (!this.cameraEditEntry) return;
      const cam = this.cameraEditEntry;
      const m = cam.model; m.updateWorldMatrix(true, true);
      const wp = new THREE.Vector3(); m.getWorldPosition(wp);
      cam.perspCamera.position.copy(wp); cam.orthoCamera.position.copy(wp);
      cam.perspCamera.quaternion.copy(m.quaternion); cam.orthoCamera.quaternion.copy(m.quaternion);
      cam.perspCamera.updateMatrixWorld(); cam.perspCamera.updateProjectionMatrix();
      cam.orthoCamera.updateMatrixWorld(); cam.orthoCamera.updateProjectionMatrix();
      cam.helper.update();
    });
    this.sceneService.overlayScene.add(this.cameraTransformControls.getHelper());
  }

  private enterCameraEditMode(sceneCam: SceneCamera): void {
    this.cameraEditEntry = sceneCam;

    this.zone.runOutsideAngular(() => {
      this.initCameraTransformControls();
      this.cameraTransformControls!.setMode('translate');
      this.cameraTransformControls!.attach(sceneCam.model);
      this.cameraTransformControls!.getHelper().updateWorldMatrix(true, true);
      this.cameraTransformControls!.getHelper().traverse((c: any) => {
        if (c.material) { c.renderOrder = Infinity; c.material.depthTest = false; c.material.depthWrite = false; }
      });
    });
  }

  private exitCameraEditMode(): void {
    this.cameraEditEntry = undefined;
    if (this.cameraTransformControls) {
      this.cameraTransformControls.detach();
    }
    this.sceneService.controls.enabled = true;
  }
}
