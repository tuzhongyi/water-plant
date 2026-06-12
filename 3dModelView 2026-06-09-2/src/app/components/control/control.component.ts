import {
  Component, OnDestroy,
  inject, NgZone, input, output, effect,
} from '@angular/core';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import * as THREE from 'three';

@Component({
  selector: 'app-control',
  standalone: true,
  template: '',
})
export class ControlComponent implements OnDestroy {
  camera = input.required<THREE.PerspectiveCamera>();
  rendererDomElement = input.required<HTMLCanvasElement>();
  controls = input.required<any>();
  overlayScene = input.required<THREE.Scene>();
  editEntryGroup = input.required<THREE.Group | null>();
  transformMode = input<'translate' | 'rotate' | 'scale'>('translate');

  modeChange = output<'translate' | 'rotate' | 'scale'>();
  transformChange = output<{ pos: THREE.Vector3; scl: THREE.Vector3; rot: THREE.Euler }>();

  private zone = inject(NgZone);
  private transformControls?: TransformControls;

  constructor() {
    effect(() => {
      const group = this.editEntryGroup();
      if (group) this.attachTC(group);
      else this.detachTC();
    });

    effect(() => {
      const mode = this.transformMode();
      if (this.transformControls) this.transformControls.setMode(mode);
    });
  }

  ngOnDestroy(): void {
    this.detachTC();
  }

  private attachTC(group: THREE.Group): void {
    if (this.transformControls) {
      this.transformControls.attach(group);
      return;
    }

    this.zone.runOutsideAngular(() => {
      const tc = new TransformControls(this.camera(), this.rendererDomElement());
      (tc as any).size = 0.7;
      tc.setMode(this.transformMode());

      (tc as any).addEventListener('dragging-changed', (ev: any) => {
        this.controls().enabled = !ev.value;
      });

      (tc as any).addEventListener('change', () => {
        const g = tc.object as THREE.Group;
        if (!g) return;
        g.updateWorldMatrix(true, true);
        const wp = new THREE.Vector3(); g.getWorldPosition(wp);
        this.transformChange.emit({ pos: wp, scl: g.scale.clone(), rot: g.rotation.clone() });
      });

      this.overlayScene().add(tc.getHelper());
      tc.attach(group);

      tc.getHelper().updateWorldMatrix(true, true);
      tc.getHelper().traverse((c: any) => {
        if (c.material) {
          c.renderOrder = Infinity;
          c.material.depthTest = false;
          c.material.depthWrite = false;
        }
      });

      this.transformControls = tc;
    });
  }

  private detachTC(): void {
    if (!this.transformControls) return;
    this.transformControls.detach();
    this.overlayScene().remove(this.transformControls.getHelper());
    this.controls().enabled = true;
    this.transformControls.dispose();
    this.transformControls = undefined;
  }
}
