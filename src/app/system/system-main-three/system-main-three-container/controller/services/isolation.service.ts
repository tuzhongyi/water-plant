import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { ModelEntry } from '../models/types';
import { StateService } from './state.service';

@Injectable({ providedIn: 'root' })
export class IsolationService {
  private state = inject(StateService);

  private isolatedEntry: ModelEntry | null = null;
  private isolatedMeshName: string | null = null;

  isolateMesh(entry: ModelEntry, meshName: string): void {
    if (this.isolatedEntry === entry && this.isolatedMeshName === meshName) {
      this.clearIsolation();
      return;
    }

    this.clearIsolation();
    this.isolatedEntry = entry;
    this.isolatedMeshName = meshName;

    entry.wrapper.traverse(c => {
      const m = c as THREE.Mesh;
      if (m.isMesh) {
        m.visible = c.name === meshName;
      }
    });

    if (entry.edgesGroup) entry.edgesGroup.visible = false;
    if (entry.depthPrePassGroup) entry.depthPrePassGroup.visible = false;
  }

  /** 按材质名称隔离：仅显示使用该材质的所有 mesh */
  isolateByMaterial(entry: ModelEntry, materialName: string): void {
    if (this.isolatedEntry === entry && this.isolatedMeshName === materialName) {
      this.clearIsolation();
      return;
    }

    this.clearIsolation();
    this.isolatedEntry = entry;
    this.isolatedMeshName = materialName;

    entry.wrapper.traverse(c => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      const match = mats.some(mat =>
        ((mat as THREE.MeshStandardMaterial).name || m.name) === materialName
      );
      m.visible = match;
    });

    if (entry.edgesGroup) entry.edgesGroup.visible = false;
    if (entry.depthPrePassGroup) entry.depthPrePassGroup.visible = false;
  }

  clearIsolation(): void {
    if (this.isolatedEntry) {
      this.isolatedEntry.wrapper.traverse(c => {
        if ((c as THREE.Mesh).isMesh) {
          c.visible = true;
        }
      });
      this.isolatedEntry = null;
      this.isolatedMeshName = null;
    }
  }

  isIsolated(entry: ModelEntry, meshName?: string): boolean {
    if (!meshName) return this.isolatedEntry === entry;
    return this.isolatedEntry === entry && this.isolatedMeshName === meshName;
  }
}
