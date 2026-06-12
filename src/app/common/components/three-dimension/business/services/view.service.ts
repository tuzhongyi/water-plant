import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { SceneService } from './scene.service';
import { StateService } from './state.service';
import { VIEW_PRESETS } from '../models/constants';
import { ViewPresetConfig } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ViewService {
  private sceneService = inject(SceneService);
  private state = inject(StateService);

  setViewPreset(name: string): void {
    const cfg = VIEW_PRESETS[name];
    if (!cfg) return;

    this.state.viewPreset$.next(name);

    const cam = this.sceneService.camera;
    const ctrl = this.sceneService.controls;

    /* 相机位置: 从原点向目前方向延伸 camDist */
    const dir = cam.position.clone().normalize();
    const tgt = new THREE.Vector3(0, 0, 0);
    const pos = dir.multiplyScalar(cfg.camDist);

    this.animateCamera(pos, tgt, 600, () => {
      cam.far = cfg.far;
      cam.updateProjectionMatrix();
      ctrl.maxDistance = cfg.maxDist;
    });

    /* 网格大小 */
    this.sceneService.setGridSize(cfg.grid);

    /* 坐标轴长度：网格的 1/5 */
    this.sceneService.setAxesSize(Math.max(cfg.grid / 5, 2));

    this.state.updateSettings({
      viewPreset: name as any,
      cameraFar: cfg.far,
      camPos: { x: pos.x, y: pos.y, z: pos.z },
      camTgt: { x: tgt.x, y: tgt.y, z: tgt.z },
    });
  }

  setStandardView(direction: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'): void {
    const ctrl = this.sceneService.controls;
    const dist = this.sceneService.camera.position.distanceTo(ctrl.target);
    const tgt = ctrl.target.clone();

    const dirs: Record<string, THREE.Vector3> = {
      front:  new THREE.Vector3(0, 0, 1),
      back:   new THREE.Vector3(0, 0, -1),
      left:   new THREE.Vector3(-1, 0, 0),
      right:  new THREE.Vector3(1, 0, 0),
      top:    new THREE.Vector3(0, 1, 0),
      bottom: new THREE.Vector3(0, -1, 0),
    };

    const dir = dirs[direction];
    const pos = tgt.clone().addScaledVector(dir, dist);
    this.animateCamera(pos, tgt, 500);
  }

  getPresetConfig(name: string): ViewPresetConfig | undefined {
    return VIEW_PRESETS[name];
  }

  animateCamera(
    targetPos: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    duration = 800,
    onDone?: () => void
  ): void {
    const cam = this.sceneService.camera;
    const ctrl = this.sceneService.controls;
    const startPos = cam.position.clone();
    const startTgt = ctrl.target.clone();
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1.0);
      const ease = 1 - Math.pow(1 - t, 3);

      cam.position.lerpVectors(startPos, targetPos, ease);
      ctrl.target.lerpVectors(startTgt, targetLookAt, ease);
      ctrl.update();

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        onDone?.();
      }
    };

    requestAnimationFrame(step);
  }
}
