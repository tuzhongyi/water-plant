import {
  Component, ElementRef, ViewChild, AfterViewInit, OnDestroy,
  inject, NgZone, output, ChangeDetectionStrategy, HostListener,
  input, effect,
} from '@angular/core';
import * as THREE from 'three';
import { SceneService } from '../../services/scene.service';
import { ModelViewerModel, SceneCamera } from '../../models/types';

interface InternalModelState {
  id: string;
  group: THREE.Group;
  meshes: THREE.Mesh[];
  locked: boolean;
  bboxHelper?: THREE.Box3Helper;
}

@Component({
  selector: 'app-model-viewer',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; position: relative; overflow: hidden; }
    canvas { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  /* ---- Inputs ---- */
  models = input<ModelViewerModel[]>([]);
  sceneCameras = input<SceneCamera[]>([]);
  activeCameraId = input<string | null>(null);
  showBBox = input<boolean>(false);

  /* ---- Outputs ---- */
  modelClick = output<string>();
  modelHover = output<string | null>();
  modelDoubleClick = output<string>();
  cameraClick = output<string>();
  blankClick = output<void>();
  keyEvent = output<{ type: 'down' | 'up'; key: string }>();

  /* ---- Services ---- */
  private zone = inject(NgZone);
  private sceneService = inject(SceneService);

  /* ---- Three.js ---- */
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private perspCamera!: THREE.PerspectiveCamera;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private sceneReady = false;

  /* ---- Internal state ---- */
  private internalModels = new Map<string, InternalModelState>();
  private hoveredId: string | null = null;
  private hoveredCamId: string | null = null;
  private cameraBBoxHelpers = new Map<string, THREE.Box3Helper>();
  private pressedKeys = new Set<string>();
  private subCamSyncAdded = false;

  constructor() {
    effect(() => this.syncModels(this.models()));
    effect(() => this.onShowBBoxChange(this.showBBox()));
    effect(() => this.onSceneCamerasChange(this.sceneCameras()));
    effect(() => this.onActiveCameraChange(this.activeCameraId()));
  }

  /* ---- Lifecycle ---- */

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    this.sceneService.init(container, canvas);

    this.scene = this.sceneService.scene;
    this.renderer = this.sceneService.renderer;
    this.perspCamera = this.sceneService.camera as THREE.PerspectiveCamera;

    this.bindEvents();
    this.sceneReady = true;
    this.sceneService.addBeforeRender(this.camBBoxUpdate);
  }

  ngOnDestroy(): void {
    this.sceneService.removeBeforeRender(this.camBBoxUpdate);
    if (this.subCamSyncAdded) {
      this.sceneService.removeBeforeRender(this.subCamSync);
    }
    for (const s of this.internalModels.values()) {
      this.scene.remove(s.group);
      if (s.bboxHelper) { this.scene.remove(s.bboxHelper); s.bboxHelper.dispose(); }
    }
    this.internalModels.clear();
    for (const h of this.cameraBBoxHelpers.values()) {
      this.scene.remove(h);
      h.dispose();
    }
    this.cameraBBoxHelpers.clear();
    this.sceneService.dispose();
  }

  /* ---- Events ---- */

  private bindEvents(): void {
    const canvas = this.sceneService.renderer.domElement;
    canvas.addEventListener('contextmenu', (e: Event) => e.preventDefault());
    canvas.addEventListener('pointermove', (e: PointerEvent) => this.onPointerMove(e));
    canvas.addEventListener('click', (e: MouseEvent) => this.onClick(e));
    canvas.addEventListener('dblclick', (e: MouseEvent) => this.onDoubleClick(e));
  }

  private getCanvas(): HTMLCanvasElement {
    return this.sceneService.renderer.domElement;
  }

  private updateMouse(e: PointerEvent | MouseEvent): void {
    const canvas = this.getCanvas();
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /* ---- Model sync ---- */

  private syncModels(targets: ModelViewerModel[]): void {
    if (!this.sceneReady) return;
    const targetIds = new Set(targets.map(m => m.id));

    for (const [id, s] of this.internalModels) {
      if (!targetIds.has(id)) {
        this.scene.remove(s.group);
        if (s.bboxHelper) { this.scene.remove(s.bboxHelper); s.bboxHelper.dispose(); }
        this.internalModels.delete(id);
      }
    }

    for (const model of targets) {
      if (this.internalModels.has(model.id)) {
        const existing = this.internalModels.get(model.id)!;
        existing.locked = model.locked ?? false;
        continue;
      }
      if (!model.group) continue;

      const meshes: THREE.Mesh[] = [];
      model.group.traverse(c => { if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh); });

      const s: InternalModelState = {
        id: model.id, group: model.group, meshes,
        locked: model.locked ?? false,
      };

      if (!model.group.parent) {
        this.scene.add(model.group);
      }
      this.internalModels.set(model.id, s);
    }
  }

  private getAllMeshes(): { mesh: THREE.Mesh; modelId: string }[] {
    const result: { mesh: THREE.Mesh; modelId: string }[] = [];
    for (const [id, s] of this.internalModels) {
      if (s.locked) continue;
      for (const mesh of s.meshes) result.push({ mesh, modelId: id });
    }
    return result;
  }

  /* ---- Pointer move ---- */

  private onPointerMove(e: PointerEvent): void {
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.perspCamera);

    const all = this.getAllMeshes();
    const hits = this.raycaster.intersectObjects(all.map(a => a.mesh), false);

    let newHovered: string | null = null;
    if (hits.length > 0) {
      const hitObj = hits[0].object as THREE.Mesh;
      const found = all.find(a => a.mesh === hitObj);
      if (found) newHovered = found.modelId;
    }

    if (this.hoveredId !== newHovered) {
      this.hoveredId = newHovered;
      this.modelHover.emit(newHovered);
    }

    this.detectCameraHover();
  }

  private detectCameraHover(): void {
    const cams = this.sceneCameras();
    const camModels: THREE.Object3D[] = cams.map(c => c.model);
    const camHits = this.raycaster.intersectObjects(camModels, true);
    let newHovered: string | null = null;
    if (camHits.length > 0) {
      for (const sceneCam of cams) {
        if (camHits[0].object === sceneCam.model || sceneCam.model.children.includes(camHits[0].object)) {
          newHovered = sceneCam.id;
          break;
        }
      }
    }
    this.hoveredCamId = newHovered;
  }

  /* ---- Click ---- */

  private onClick(e: MouseEvent): void {
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.perspCamera);

    const all = this.getAllMeshes();
    const hits = this.raycaster.intersectObjects(all.map(a => a.mesh), false);
    if (hits.length > 0) {
      const hitObj = hits[0].object as THREE.Mesh;
      const found = all.find(a => a.mesh === hitObj);
      if (found) {
        this.modelClick.emit(found.modelId);
        return;
      }
    }

    const cams = this.sceneCameras();
    const camModels: THREE.Object3D[] = cams.map(c => c.model);
    const camHits = this.raycaster.intersectObjects(camModels, true);
    if (camHits.length > 0) {
      for (const sceneCam of cams) {
        if (camHits[0].object === sceneCam.model || sceneCam.model.children.includes(camHits[0].object)) {
          this.cameraClick.emit(sceneCam.id);
          return;
        }
      }
    }

    this.blankClick.emit();
  }

  /* ---- Double click ---- */

  private onDoubleClick(e: MouseEvent): void {
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.perspCamera);

    const all = this.getAllMeshes();
    const hits = this.raycaster.intersectObjects(all.map(a => a.mesh), false);
    if (hits.length > 0) {
      const hitObj = hits[0].object as THREE.Mesh;
      const found = all.find(a => a.mesh === hitObj);
      if (found) this.modelDoubleClick.emit(found.modelId);
    }
  }

  /* ---- Keyboard ---- */

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();

    if (this.activeCameraId() && ['w', 'a', 's', 'd'].includes(key)) {
      this.pressedKeys.add(key);
      e.preventDefault();
      return;
    }

    this.keyEvent.emit({ type: 'down', key });
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    this.pressedKeys.delete(key);
    this.keyEvent.emit({ type: 'up', key });
  }

  /* ---- Bounding Box ---- */

  private onShowBBoxChange(show: boolean): void {
    if (!this.sceneReady) return;
    if (show) {
      for (const s of this.internalModels.values()) {
        if (!s.bboxHelper) this.createModelBBox(s);
      }
      for (const cam of this.sceneCameras()) {
        if (!this.cameraBBoxHelpers.has(cam.id)) this.createCameraBBox(cam);
      }
    } else {
      for (const s of this.internalModels.values()) {
        if (s.bboxHelper) { this.scene.remove(s.bboxHelper); s.bboxHelper.dispose(); s.bboxHelper = undefined; }
      }
      for (const [id, h] of this.cameraBBoxHelpers) {
        this.scene.remove(h); h.dispose();
      }
      this.cameraBBoxHelpers.clear();
    }
  }

  private createModelBBox(s: InternalModelState): void {
    const box = new THREE.Box3().setFromObject(s.group);
    const helper = new THREE.Box3Helper(box, new THREE.Color(0xff8800));
    helper.name = 'bboxHelper_' + s.id;
    helper.renderOrder = 999;
    this.scene.add(helper);
    s.bboxHelper = helper;
  }

  /* ---- Camera BBox ---- */

  private onSceneCamerasChange(cams: SceneCamera[]): void {
    if (!this.sceneReady) return;
    const newIds = new Set(cams.map(c => c.id));

    for (const [id, h] of this.cameraBBoxHelpers) {
      if (!newIds.has(id)) { this.scene.remove(h); h.dispose(); this.cameraBBoxHelpers.delete(id); }
    }

    if (this.showBBox()) {
      for (const cam of cams) {
        if (!this.cameraBBoxHelpers.has(cam.id)) this.createCameraBBox(cam);
      }
    }
  }

  private createCameraBBox(cam: SceneCamera): void {
    const box = new THREE.Box3().setFromObject(cam.model);
    const size = new THREE.Vector3(); box.getSize(size);
    if (size.length() < 0.01) return;
    const helper = new THREE.Box3Helper(box, new THREE.Color(0x07a990));
    helper.name = 'camBBox_' + cam.name;
    helper.renderOrder = 999;
    this.cameraBBoxHelpers.set(cam.id, helper);
    this.scene.add(helper);
  }

  private camBBoxUpdate = (): void => {
    if (!this.showBBox()) return;
    for (const cam of this.sceneCameras()) {
      const helper = this.cameraBBoxHelpers.get(cam.id);
      if (!helper) continue;
      const box = new THREE.Box3().setFromObject(cam.model);
      helper.box.copy(box);
    }
  };

  /* ---- Sub-camera sync ---- */

  private onActiveCameraChange(id: string | null): void {
    if (!this.sceneReady) return;
    if (id) {
      if (!this.subCamSyncAdded) {
        this.sceneService.addBeforeRender(this.subCamSync);
        this.subCamSyncAdded = true;
      }
    } else {
      if (this.subCamSyncAdded) {
        this.sceneService.removeBeforeRender(this.subCamSync);
        this.subCamSyncAdded = false;
        this.pressedKeys.clear();
      }
    }
  }

  private subCamSync = (): void => {
    const activeId = this.activeCameraId();
    if (!activeId) return;
    const sceneCam = this.sceneCameras().find(c => c.id === activeId);
    if (!sceneCam) return;

    const mainCam = this.sceneService.camera;
    const ctrl = this.sceneService.controls;

    sceneCam.perspCamera.position.copy(mainCam.position);
    sceneCam.perspCamera.quaternion.copy(mainCam.quaternion);
    sceneCam.orthoCamera.position.copy(mainCam.position);
    sceneCam.orthoCamera.quaternion.copy(mainCam.quaternion);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(mainCam.quaternion);
    sceneCam.perspCamera.lookAt(mainCam.position.clone().add(dir));
    sceneCam.orthoCamera.lookAt(mainCam.position.clone().add(dir));
    if (mainCam instanceof THREE.PerspectiveCamera) {
      sceneCam.perspCamera.fov = mainCam.fov;
      sceneCam.perspCamera.updateProjectionMatrix();
    } else if (mainCam instanceof THREE.OrthographicCamera) {
      sceneCam.orthoCamera.zoom = mainCam.zoom;
      sceneCam.orthoCamera.updateProjectionMatrix();
    }
    sceneCam.perspCamera.updateMatrixWorld();
    sceneCam.orthoCamera.updateMatrixWorld();
    sceneCam.helper.update();

    const speed = this.sceneService.wasdSpeed;
    const camDir = new THREE.Vector3(); mainCam.getWorldDirection(camDir); camDir.normalize();
    const right = new THREE.Vector3().crossVectors(camDir, mainCam.up).normalize();
    if (this.pressedKeys.has('w')) { mainCam.position.addScaledVector(camDir, speed); ctrl.target.addScaledVector(camDir, speed); }
    if (this.pressedKeys.has('s')) { mainCam.position.addScaledVector(camDir, -speed); ctrl.target.addScaledVector(camDir, -speed); }
    if (this.pressedKeys.has('a')) { mainCam.position.addScaledVector(right, -speed); ctrl.target.addScaledVector(right, -speed); }
    if (this.pressedKeys.has('d')) { mainCam.position.addScaledVector(right, speed); ctrl.target.addScaledVector(right, speed); }
  };
}
