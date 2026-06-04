import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { SceneService } from './scene.service';
import { StateService } from './state.service';
import { ModelEntry, RenderMode } from '../models/types';

@Injectable({ providedIn: 'root' })
export class EdgesService {
  private sceneService = inject(SceneService);
  private state = inject(StateService);

  createHardEdgesForEntry(entry: ModelEntry): void {
    this.removeEdgesForEntry(entry);

    const thresholdRad = THREE.MathUtils.degToRad(entry.renderSettings?.thresholdAngle ?? this.state.thresholdAngle);
    const edgeColor = entry.colors.normal.edge;
    const lineWidth = entry.renderSettings?.edgeLineWidth ?? this.state.edgeLineWidth;

    const positionAttr: number[] = [];
    const meshes = this.filterUserMeshes(entry);

    for (const mesh of meshes) {
      if (!mesh.geometry) continue;
      const geo = mesh.geometry;
      if (!geo.index) continue;

      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      const idx = geo.index;

      const faceCount = idx.count / 3;

      const faceNormals: THREE.Vector3[] = [];
      for (let i = 0; i < faceCount; i++) {
        const a = new THREE.Vector3().fromBufferAttribute(pos, idx.getX(i * 3));
        const b = new THREE.Vector3().fromBufferAttribute(pos, idx.getX(i * 3 + 1));
        const c = new THREE.Vector3().fromBufferAttribute(pos, idx.getX(i * 3 + 2));
        faceNormals.push(
          new THREE.Vector3().crossVectors(
            new THREE.Vector3().subVectors(b, a),
            new THREE.Vector3().subVectors(c, a)
          ).normalize()
        );
      }

      const neighborFaces = new Map<string, number[]>();
      for (let i = 0; i < faceCount; i++) {
        const a = idx.getX(i * 3);
        const b = idx.getX(i * 3 + 1);
        const c = idx.getX(i * 3 + 2);
        for (const [v0, v1] of [[a, b], [b, c], [c, a]]) {
          const min = Math.min(v0, v1);
          const max = Math.max(v0, v1);
          const key = `${min}_${max}`;
          if (!neighborFaces.has(key)) neighborFaces.set(key, []);
          neighborFaces.get(key)!.push(i);
        }
      }

      for (const [key, faces] of neighborFaces) {
        if (faces.length === 1) {
          const [v0, v1] = key.split('_').map(Number);
          const p0 = new THREE.Vector3().fromBufferAttribute(pos, v0);
          const p1 = new THREE.Vector3().fromBufferAttribute(pos, v1);
          p0.applyMatrix4(mesh.matrixWorld);
          p1.applyMatrix4(mesh.matrixWorld);
          positionAttr.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
        } else if (faces.length >= 2) {
          const n0 = faceNormals[faces[0]];
          const n1 = faceNormals[faces[1]];
          const dot = n0.dot(n1);
          const clamped = Math.max(-1, Math.min(1, dot));
          const angle = Math.acos(clamped);
          if (angle >= thresholdRad) {
            const [v0, v1] = key.split('_').map(Number);
            const p0 = new THREE.Vector3().fromBufferAttribute(pos, v0);
            const p1 = new THREE.Vector3().fromBufferAttribute(pos, v1);
            p0.applyMatrix4(mesh.matrixWorld);
            p1.applyMatrix4(mesh.matrixWorld);
            positionAttr.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
          }
        }
      }
    }

    if (positionAttr.length === 0) return;

    const edgeGeo = new LineSegmentsGeometry();
    edgeGeo.setPositions(positionAttr);

    const lineMat = new LineMaterial({
      color: new THREE.Color(edgeColor),
      linewidth: lineWidth,
      worldUnits: false,
      resolution: new THREE.Vector2(
        this.sceneService.renderer.domElement.width,
        this.sceneService.renderer.domElement.height
      ),
      dashed: false,
      alphaToCoverage: false,
      transparent: true,
    });

    const lineSegs = new LineSegments2(edgeGeo, lineMat);
    lineSegs.renderOrder = 1;
    lineSegs.material.depthTest = true;
    lineSegs.material.depthWrite = true;

    const edgesGroup = new THREE.Group();
    edgesGroup.name = 'edges_' + entry.fileName;
    edgesGroup.add(lineSegs);
    entry.wrapper.add(edgesGroup);
    entry.edgesGroup = edgesGroup;
  }

  createDepthPrePass(entry: ModelEntry): void {
    this.removeDepthPrePass(entry);

    const depthGroup = new THREE.Group();
    depthGroup.name = 'depthPrePass_' + entry.fileName;

    const meshes = this.filterUserMeshes(entry);
    for (const mesh of meshes) {
      if (!mesh.geometry) continue;
      const clone = new THREE.Mesh(
        mesh.geometry,
        new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: true,
        })
      );
      clone.applyMatrix4(mesh.matrixWorld);
      depthGroup.add(clone);
    }

    entry.wrapper.add(depthGroup);
    entry.depthPrePassGroup = depthGroup;
  }

  applyRenderMode(entry: ModelEntry, mode: RenderMode): void {
    const meshes = this.filterUserMeshes(entry);

    const solidSeeThrough = entry.renderSettings?.solidSeeThrough ?? this.state.settings.solidSeeThrough;
    const baseOpacity = mode === 'edges' ? 0 : (entry.renderSettings?.solidOpacity ?? this.state.solidOpacity);
    const opacity = baseOpacity;
    const showColor = mode !== 'edges';

    for (const mesh of meshes) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => {
          m.side = solidSeeThrough ? THREE.DoubleSide : THREE.FrontSide;
          m.transparent = solidSeeThrough || opacity < 1;
          m.opacity = opacity;
          m.depthTest = !solidSeeThrough;
          m.depthWrite = solidSeeThrough ? false : opacity >= 1;
          this.setMaterialColorWrite(m, showColor);
          m.needsUpdate = true;
        });
      } else {
        mesh.material.side = solidSeeThrough ? THREE.DoubleSide : THREE.FrontSide;
        mesh.material.transparent = solidSeeThrough || opacity < 1;
        mesh.material.opacity = opacity;
        mesh.material.depthTest = !solidSeeThrough;
        mesh.material.depthWrite = solidSeeThrough ? false : opacity >= 1;
        this.setMaterialColorWrite(mesh.material, showColor);
        mesh.material.needsUpdate = true;
      }
    }

    /* toggle edges visibility */
    if (entry.edgesGroup) {
      entry.edgesGroup.visible = mode !== 'solid';
      if (mode !== 'solid') {
        const wfOpacity = entry.renderSettings?.wfOpacity ?? this.state.wfOpacity;
        const edgeSeeThrough = entry.renderSettings?.edgeSeeThrough ?? this.state.settings.edgeSeeThrough;
        entry.edgesGroup.traverse(c => {
          if ((c as any).isLineSegments2) {
            (c as any).material.opacity = wfOpacity;
            (c as any).material.transparent = true;
            (c as any).material.depthTest = !edgeSeeThrough;
            (c as any).material.needsUpdate = true;
          }
        });
      }
    }

    /* depth pre-pass for transparent modes */
    if (mode === 'overlay' || mode === 'edges') {
      if (!entry.depthPrePassGroup) this.createDepthPrePass(entry);
      entry.depthPrePassGroup!.visible = true;
    } else {
      if (entry.depthPrePassGroup) entry.depthPrePassGroup.visible = false;
    }
  }

  removeEdgesForEntry(entry: ModelEntry): void {
    if (entry.edgesGroup) {
      entry.edgesGroup.traverse(c => {
        if (c instanceof LineSegments2) {
          c.geometry?.dispose();
          (c.material as THREE.Material)?.dispose();
        }
      });
      entry.wrapper.remove(entry.edgesGroup);
      entry.edgesGroup = undefined;
    }
  }

  removeDepthPrePass(entry: ModelEntry): void {
    if (entry.depthPrePassGroup) {
      entry.depthPrePassGroup.traverse(c => {
        const m = c as THREE.Mesh;
        if (m.isMesh) {
          (m.material as THREE.Material)?.dispose();
        }
      });
      entry.wrapper.remove(entry.depthPrePassGroup);
      entry.depthPrePassGroup = undefined;
    }
  }

  filterUserMeshes(entry: ModelEntry): THREE.Mesh[] {
    const skip = new Set<THREE.Object3D>();
    if (entry.depthPrePassGroup) skip.add(entry.depthPrePassGroup);
    if (entry.edgesGroup) skip.add(entry.edgesGroup);

    const result: THREE.Mesh[] = [];
    entry.wrapper.traverse(c => {
      if (!(c as THREE.Mesh).isMesh) return;
      let p: THREE.Object3D | null = c.parent;
      while (p && p !== entry.wrapper) {
        if (skip.has(p)) return;
        p = p.parent;
      }
      result.push(c as THREE.Mesh);
    });
    return result;
  }

  private setMaterialColorWrite(mat: THREE.Material, write: boolean): void {
    if ((mat as any).colorWrite !== undefined) {
      (mat as any).colorWrite = write;
    }
  }
}
