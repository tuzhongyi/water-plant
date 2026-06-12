import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as THREE from 'three';
import { StateService } from '../../services/state.service';
import { SceneService } from '../../services/scene.service';
import { SceneCamera } from '../../models/types';

type CamColorState = 'normal' | 'hover' | 'selected';

@Component({
  selector: 'app-camera-info-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (selectedCam) {
      <div class="cam-card">
        <div class="card-header">
          <span>{{ selectedCam.name }}</span>
          <button class="close-btn" (click)="deselectCamera()">×</button>
        </div>

        <div class="card-body">
          <!-- 颜色状态 Tab -->
          <div class="state-group">
            <div class="tab-bar">
              @for (st of colorStates; track st) {
                <button [class.active]="activeColorState === st"
                        (click)="setColorState(st)">{{ stateLabel(st) }}</button>
              }
            </div>
            <div class="state-body">
              <div class="color-group">
                <label>机身颜色</label>
                <div class="color-row">
                  <input type="color"
                         [ngModel]="selectedCam.colors[activeColorState].body"
                         (ngModelChange)="setBodyColor(activeColorState, $event)" />
                  <span class="hex-label">{{ selectedCam.colors[activeColorState].body }}</span>
                </div>
              </div>
              <div class="color-group">
                <label>镜头颜色</label>
                <div class="color-row">
                  <input type="color"
                         [ngModel]="selectedCam.colors[activeColorState].lens"
                         (ngModelChange)="setLensColor(activeColorState, $event)" />
                  <span class="hex-label">{{ selectedCam.colors[activeColorState].lens }}</span>
                </div>
              </div>
              <div class="color-group">
                <label>取景器颜色</label>
                <div class="color-row">
                  <input type="color"
                         [ngModel]="selectedCam.colors[activeColorState].viewfinder"
                         (ngModelChange)="setVfColor(activeColorState, $event)" />
                  <span class="hex-label">{{ selectedCam.colors[activeColorState].viewfinder }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-group">
            <label>名称</label>
            <input type="text" [(ngModel)]="selectedCam.name" />
          </div>

          <div class="info-group">
            <label>位置</label>
            <div class="input-row">
              <span>X</span>
              <input type="number" step="0.1" [(ngModel)]="pos.x" (ngModelChange)="onChange()" />
              <span>Y</span>
              <input type="number" step="0.1" [(ngModel)]="pos.y" (ngModelChange)="onChange()" />
              <span>Z</span>
              <input type="number" step="0.1" [(ngModel)]="pos.z" (ngModelChange)="onChange()" />
            </div>
          </div>

          <div class="info-group">
            <label>旋转 H: {{ rot.h.toFixed(1) }}°</label>
            <div class="slider-row">
              <input type="range" min="-180" max="180" step="0.5"
                     [ngModel]="rot.h" (ngModelChange)="setRot('h', $event)" />
              <input type="number" step="0.5"
                     [ngModel]="rot.h" (ngModelChange)="setRot('h', $event)" />
            </div>
            <label>旋转 P: {{ rot.p.toFixed(1) }}°</label>
            <div class="slider-row">
              <input type="range" min="-180" max="180" step="0.5"
                     [ngModel]="rot.p" (ngModelChange)="setRot('p', $event)" />
              <input type="number" step="0.5"
                     [ngModel]="rot.p" (ngModelChange)="setRot('p', $event)" />
            </div>
            <label>旋转 B: {{ rot.b.toFixed(1) }}°</label>
            <div class="slider-row">
              <input type="range" min="-180" max="180" step="0.5"
                     [ngModel]="rot.b" (ngModelChange)="setRot('b', $event)" />
              <input type="number" step="0.5"
                     [ngModel]="rot.b" (ngModelChange)="setRot('b', $event)" />
            </div>
          </div>

          <div class="info-group">
            @if (!selectedCam.isOrtho) {
              <label>FOV: {{ selectedCam.perspCamera.fov.toFixed(1) }}°</label>
              <div class="slider-row">
                <input type="range" min="10" max="120" step="0.5"
                       [ngModel]="selectedCam.perspCamera.fov"
                       (ngModelChange)="setFov($event)" />
                <input type="number" min="10" max="120" step="0.5"
                       [ngModel]="selectedCam.perspCamera.fov"
                       (ngModelChange)="setFov($event)" />
              </div>
            }
            @if (selectedCam.isOrtho) {
              <label>Zoom: {{ selectedCam.orthoCamera.zoom.toFixed(2) }}</label>
              <div class="slider-row">
                <input type="range" min="0.1" max="10" step="0.1"
                       [ngModel]="selectedCam.orthoCamera.zoom"
                       (ngModelChange)="setZoom($event)" />
                <input type="number" min="0.1" max="10" step="0.1"
                       [ngModel]="selectedCam.orthoCamera.zoom"
                       (ngModelChange)="setZoom($event)" />
              </div>
            }
          </div>

          <div class="info-group">
            <label>近裁面: {{ selectedCam.camera.near.toFixed(3) }}</label>
            <div class="slider-row">
              <input type="range" min="0.001" max="50" step="0.001"
                     [ngModel]="selectedCam.camera.near"
                     (ngModelChange)="setNear($event)" />
              <input type="number" min="0.001" step="0.001"
                     [ngModel]="selectedCam.camera.near"
                     (ngModelChange)="setNear($event)" />
            </div>
          </div>

          <div class="info-group">
            <label>远裁面: {{ selectedCam.camera.far.toFixed(0) }}</label>
            <div class="slider-row">
              <input type="range" min="10" max="5000" step="100"
                     [ngModel]="selectedCam.camera.far"
                     (ngModelChange)="setFar($event)" />
              <input type="number" min="10" step="100"
                     [ngModel]="selectedCam.camera.far"
                     (ngModelChange)="setFar($event)" />
            </div>
          </div>

          <div class="info-group">
            <label>WASD 移动速度: {{ sceneService.wasdSpeed.toFixed(2) }}</label>
            <div class="slider-row">
              <input type="range" min="0.01" max="0.5" step="0.01"
                     [ngModel]="sceneService.wasdSpeed"
                     (ngModelChange)="sceneService.wasdSpeed = $event" />
              <input type="number" min="0.01" max="0.5" step="0.01"
                     [ngModel]="sceneService.wasdSpeed"
                     (ngModelChange)="sceneService.wasdSpeed = $event" />
            </div>
          </div>

          <div class="info-group">
            <label>投影模式</label>
            <div class="toggle-row">
              <button [class.active]="!selectedCam.isOrtho"
                      (click)="setCameraType(false)">透视</button>
              <button [class.active]="selectedCam.isOrtho"
                      (click)="setCameraType(true)">正交</button>
            </div>
          </div>

          <div class="info-group">
            <button class="switch-main-btn" (click)="toggleFromCard()">
              {{ (state.activeSceneCameraId$ | async) === selectedCam.id ? '切回主摄像机' : '切换到此视角' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cam-card {
      position: absolute; top: 4px; right: 4px;
      width: 280px; max-height: calc(100% - 8px); overflow-y: auto;
      background: #0a1a1d; border: 1px solid #173438; border-radius: 6px;
      color: #ccc; font-size: 12px; z-index: 10;
    }
    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 10px; background: #0c1e23; border-radius: 6px 6px 0 0;
      font-weight: bold; position: sticky; top: 0; z-index: 1;
    }
    .close-btn {
      background: none; border: none; color: #ef6f59; cursor: pointer;
      font-size: 18px; line-height: 1; padding: 0 2px;
    }
    .close-btn:hover { color: #f59484; }
    .card-body { padding: 8px 10px; }

    .state-group {
      border: 1px solid #0f2529; border-radius: 4px;
      background: #091618; margin-bottom: 10px; overflow: hidden;
    }
    .tab-bar {
      display: flex; border-bottom: 1px solid #0f2529;
      background: #0a1a21;
    }
    .tab-bar button {
      flex: 1; background: none; border: none; color: #888;
      padding: 5px 2px; cursor: pointer; font-size: 11px;
      border-bottom: 2px solid transparent;
    }
    .tab-bar button:hover { color: #ccc; }
    .tab-bar button.active { color: #17f1c6; border-bottom-color: #17f1c6; }
    .state-body { padding: 6px 8px; }
    .color-group { margin-bottom: 4px; }
    .color-group:last-child { margin-bottom: 0; }
    .color-row { display: flex; align-items: center; gap: 6px; margin: 2px 0; }
    .hex-label { font-size: 10px; color: #666; font-family: monospace; }
    input[type="color"] { width: 28px; height: 22px; padding: 0; border: none; cursor: pointer; background: transparent; }

    .info-group { margin-bottom: 6px; }
    .info-group > label { display: block; font-size: 11px; color: #888; margin-bottom: 2px; margin-top: 4px; }

    .slider-row {
      display: flex; align-items: center; gap: 6px;
    }
    .slider-row input[type="range"] {
      flex: 1; height: 14px; min-width: 0;
    }
    .slider-row input[type="number"] {
      width: 64px; flex-shrink: 0;
      background: #040a0b; color: #ccc;
      border: 1px solid #1b3f46; border-radius: 2px;
      padding: 2px 4px; font-size: 11px; font-family: inherit;
    }
    .slider-row input[type="number"]:focus { border-color: #17f1c6; outline: none; }

    .input-row {
      display: flex; align-items: center; gap: 4px;
    }
    .input-row span {
      font-size: 10px; color: #888; width: 12px; text-align: right; flex-shrink: 0;
    }
    .input-row input[type="number"] {
      width: 0; flex: 1; background: #040a0b; color: #ccc;
      border: 1px solid #1b3f46; border-radius: 2px; padding: 2px 4px;
      font-size: 11px; font-family: inherit;
    }
    .input-row input[type="number"]:focus {
      border-color: #17f1c6; outline: none;
    }
    .cam-card input[type="text"] {
      width: 100%; box-sizing: border-box; background: #040a0b; color: #ccc;
      border: 1px solid #1b3f46; border-radius: 2px; padding: 2px 4px;
      font-size: 11px; font-family: inherit;
    }
    .cam-card input[type="text"]:focus { border-color: #17f1c6; outline: none; }
    .toggle-row {
      display: flex; gap: 4px;
    }
    .toggle-row button {
      flex: 1; background: #0f2529; color: #888; border: 1px solid #1b3f46;
      padding: 3px 0; border-radius: 3px; cursor: pointer; font-size: 11px;
    }
    .toggle-row button:hover { color: #ccc; background: #14353f; }
    .toggle-row button.active { color: #17f1c6; border-color: #17f1c6; background: #0a1a21; }
    .switch-main-btn {
      width: 100%; background: #07a990; color: #fff; border: none;
      padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;
    }
    .switch-main-btn:hover { background: #17f1c6; }
  `],
})
export class CameraInfoCardComponent implements OnInit, OnDestroy {
  state = inject(StateService);
  sceneService = inject(SceneService);

  selectedCam: SceneCamera | null = null;
  pos = { x: 0, y: 0, z: 0 };
  rot = { h: 0, p: 0, b: 0 };
  activeColorState: CamColorState = 'normal';
  readonly colorStates: CamColorState[] = ['normal', 'hover', 'selected'];

  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(this.state.selectedSceneCameraId$.subscribe(id => {
      const cams = this.state.sceneCameras;
      const cam = id ? cams.find(c => c.id === id) ?? null : null;
      this.selectedCam = cam ?? null;
      if (cam) this.syncFromCam(cam);
    }));

    this.subs.add(this.state.sceneCameras$.subscribe(() => {
      if (this.selectedCam) {
        const still = this.state.sceneCameras.find(c => c.id === this.selectedCam!.id);
        if (still) this.syncFromCam(still);
        else this.selectedCam = null;
      }
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  stateLabel(st: CamColorState): string {
    switch (st) {
      case 'normal': return 'Normal';
      case 'hover': return 'Hover';
      case 'selected': return 'Selected';
    }
  }

  setColorState(st: CamColorState): void {
    this.activeColorState = st;
  }

  setCameraType(isOrtho: boolean): void {
    const cam = this.selectedCam;
    if (!cam) return;
    this.sceneService.setSceneCameraOrtho(cam, isOrtho);
    this.syncFromCam(cam);
  }

  setRot(axis: 'h' | 'p' | 'b', v: number): void {
    this.rot[axis] = v;
    this.onChange();
  }

  setBodyColor(state: CamColorState, hex: string): void {
    const cam = this.selectedCam;
    if (!cam) return;
    cam.colors[state].body = hex;
    if (state === this.getCurrentCamState()) {
      this.applyCamColor(cam, state);
    }
  }

  setLensColor(state: CamColorState, hex: string): void {
    const cam = this.selectedCam;
    if (!cam) return;
    cam.colors[state].lens = hex;
    if (state === this.getCurrentCamState()) {
      this.applyCamColor(cam, state);
    }
  }

  setVfColor(state: CamColorState, hex: string): void {
    const cam = this.selectedCam;
    if (!cam) return;
    cam.colors[state].viewfinder = hex;
    if (state === this.getCurrentCamState()) {
      this.applyCamColor(cam, state);
    }
  }

  private getCurrentCamState(): CamColorState {
    if (!this.selectedCam) return 'normal';
    if (this.state.selectedSceneCameraId$.value === this.selectedCam.id) return 'selected';
    return 'normal';
  }

  private applyCamColor(cam: SceneCamera, state: CamColorState): void {
    const c = cam.colors[state];
    const emissiveIntensity = state === 'normal' ? 0.4 : state === 'hover' ? 0.7 : 0.6;
    cam.bodyMat.color.set(c.body);
    cam.bodyMat.emissive.set(c.body);
    cam.bodyMat.emissiveIntensity = emissiveIntensity;
    cam.lensMat.color.set(c.lens);
    cam.lensMat.emissive.set(c.lens);
    cam.lensMat.emissiveIntensity = state === 'normal' ? 0.2 : 0.4;
    cam.vfMat.color.set(c.viewfinder);
    cam.vfMat.emissive.set(c.viewfinder);
    cam.vfMat.emissiveIntensity = state === 'normal' ? 0.2 : 0.4;
  }

  private syncFromCam(cam: SceneCamera): void {
    const c = cam.camera;
    const p = c.position;
    const euler = new THREE.Euler().setFromQuaternion(c.quaternion, 'YXZ');
    this.pos = { x: p.x, y: p.y, z: p.z };
    this.rot = {
      h: THREE.MathUtils.radToDeg(euler.x),
      p: THREE.MathUtils.radToDeg(euler.y),
      b: THREE.MathUtils.radToDeg(euler.z),
    };
  }

  onChange(): void {
    const cam = this.selectedCam;
    if (!cam) return;
    /* 同时更新 persp 和 ortho 的位置/朝向 */
    cam.perspCamera.position.set(this.pos.x, this.pos.y, this.pos.z);
    cam.perspCamera.rotation.set(
      THREE.MathUtils.degToRad(this.rot.h),
      THREE.MathUtils.degToRad(this.rot.p),
      THREE.MathUtils.degToRad(this.rot.b),
      'YXZ'
    );
    cam.orthoCamera.position.copy(cam.perspCamera.position);
    cam.orthoCamera.quaternion.copy(cam.perspCamera.quaternion);
    cam.perspCamera.updateMatrixWorld();
    cam.perspCamera.updateProjectionMatrix();
    cam.orthoCamera.updateMatrixWorld();
    cam.orthoCamera.updateProjectionMatrix();
    cam.helper.update();
    (cam.model as any).updateTransform();

    if (this.state.activeSceneCameraId$.value === cam.id) {
      this.sceneService.switchToCamera(cam.camera);
    }
  }

  setFov(v: number): void {
    const cam = this.selectedCam;
    if (!cam) return;
    cam.perspCamera.fov = v;
    cam.perspCamera.updateMatrixWorld();
    cam.perspCamera.updateProjectionMatrix();
    cam.helper.update();
    (cam.model as any).updateTransform();
    if (this.state.activeSceneCameraId$.value === cam.id) {
      const mainCam = this.sceneService.camera;
      if (mainCam instanceof THREE.PerspectiveCamera) {
        mainCam.fov = v;
        mainCam.updateProjectionMatrix();
      }
    }
  }

  setZoom(v: number): void {
    const cam = this.selectedCam;
    if (!cam) return;
    cam.orthoCamera.zoom = v;
    cam.orthoCamera.updateProjectionMatrix();
    cam.helper.update();
    if (this.state.activeSceneCameraId$.value === cam.id) {
      const mainCam = this.sceneService.camera;
      if (mainCam instanceof THREE.OrthographicCamera) {
        mainCam.zoom = v;
        mainCam.updateProjectionMatrix();
      }
    }
  }

  setNear(v: number): void {
    const cam = this.selectedCam;
    if (!cam) return;
    cam.perspCamera.near = v;
    cam.orthoCamera.near = v;
    cam.perspCamera.updateProjectionMatrix();
    cam.orthoCamera.updateProjectionMatrix();
    cam.helper.update();
    if (this.state.activeSceneCameraId$.value === cam.id) {
      const mainCam = this.sceneService.camera;
      mainCam.near = v;
      mainCam.updateProjectionMatrix();
    }
  }

  setFar(v: number): void {
    const cam = this.selectedCam;
    if (!cam) return;
    cam.perspCamera.far = v;
    cam.orthoCamera.far = v;
    cam.perspCamera.updateProjectionMatrix();
    cam.orthoCamera.updateProjectionMatrix();
    cam.helper.update();
    if (this.state.activeSceneCameraId$.value === cam.id) {
      const mainCam = this.sceneService.camera;
      mainCam.far = v;
      mainCam.updateProjectionMatrix();
    }
  }

  toggleFromCard(): void {
    const cam = this.selectedCam;
    if (!cam) return;
    this.sceneService.toggleCameraView(cam.camera);
  }

  deselectCamera(): void {
    this.state.selectedSceneCameraId$.next(null);
  }
}
