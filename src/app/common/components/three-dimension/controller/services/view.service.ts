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

    this.state.updateSettings({
      viewPreset: name as any,
      cameraFar: cfg.far,
      camPos: { x: pos.x, y: pos.y, z: pos.z },
      camTgt: { x: tgt.x, y: tgt.y, z: tgt.z },
    });
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
