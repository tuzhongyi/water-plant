import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { SceneService } from './scene.service';
import { StateService } from './state.service';
import { ColorsService } from './colors.service';
import { ModelEntry, RenderMode } from '../models/types';

@Injectable({ providedIn: 'root' })
export class EdgesService {
  private sceneService = inject(SceneService);
  private state = inject(StateService);
  private colorsService = inject(ColorsService);

  constructor() {
    /* 模型节点可见性变化时重建边缘几何体 */
    this.state.visibilityChanged$.subscribe((id) => {
      const entry = this.state.loadedModels.get(id);
      if (entry) this.rebuildEdgesForEntry(entry);
    });
  }

  createHardEdgesForEntry(entry: ModelEntry): void {
    this.removeEdgesForEntry(entry);

    const thresholdRad = THREE.MathUtils.degToRad(this.state.thresholdAngle);
    /* 使用当前状态（normal/hover/selected）对应的边缘颜色，而非写死 normal */
    const currentState = this.colorsService.getModelState(entry);
    const edgeColor = entry.colors[currentState].edge;
    const lineWidth = this.state.edgeLineWidth;

    const positionAttr: number[] = [];
    const meshes = this.filterUserMeshes(entry, true);

    const wrapperWorldInverse = new THREE.Matrix4().copy(entry.wrapper.matrixWorld).invert();

    for (const mesh of meshes) {
      if (!mesh.geometry) continue;
      const geo = mesh.geometry;
      if (!geo.index) continue;

      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      const idx = geo.index;

      /* mesh 顶点 → wrapper 局部空间 */
      const meshToWrapper = wrapperWorldInverse.clone().multiply(mesh.matrixWorld);

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
          p0.applyMatrix4(meshToWrapper);
          p1.applyMatrix4(meshToWrapper);
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
            p0.applyMatrix4(meshToWrapper);
            p1.applyMatrix4(meshToWrapper);
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

    const meshes = this.filterUserMeshes(entry, true);
    const wrapperWorldInverse = new THREE.Matrix4().copy(entry.wrapper.matrixWorld).invert();

    for (const mesh of meshes) {
      if (!mesh.geometry) continue;
      const clone = new THREE.Mesh(
        mesh.geometry,
        new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: true,
        })
      );
      /* mesh 顶点 → wrapper 局部空间 */
      const meshToWrapper = wrapperWorldInverse.clone().multiply(mesh.matrixWorld);
      clone.applyMatrix4(meshToWrapper);
      depthGroup.add(clone);
    }

    entry.wrapper.add(depthGroup);
    entry.depthPrePassGroup = depthGroup;
  }

  applyRenderMode(entry: ModelEntry, mode: RenderMode): void {
    const meshes = this.filterUserMeshes(entry);

    /* see-through 仅在叠加模式生效 */
    const isOverlay = mode === 'overlay';
    const solidSeeThrough = isOverlay && this.state.settings.solidSeeThrough;
    const edgeSeeThrough = isOverlay && this.state.settings.edgeSeeThrough;
    const opacity = mode === 'edges' ? 0 : this.state.solidOpacity;
    const showColor = mode !== 'edges' && opacity > 0;

    for (const mesh of meshes) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => {
          m.side = solidSeeThrough ? THREE.DoubleSide : THREE.FrontSide;
          m.transparent = solidSeeThrough || opacity < 1;
          m.opacity = opacity;
          m.depthTest = !solidSeeThrough && opacity > 0;
          m.depthWrite = solidSeeThrough ? false : opacity >= 1;
          this.setMaterialColorWrite(m, showColor);
          m.needsUpdate = true;
        });
      } else {
        mesh.material.side = solidSeeThrough ? THREE.DoubleSide : THREE.FrontSide;
        mesh.material.transparent = solidSeeThrough || opacity < 1;
        mesh.material.opacity = opacity;
        mesh.material.depthTest = !solidSeeThrough && opacity > 0;
        mesh.material.depthWrite = solidSeeThrough ? false : opacity >= 1;
        this.setMaterialColorWrite(mesh.material, showColor);
        mesh.material.needsUpdate = true;
      }
    }

    /* 切换边缘可见性 */
    if (entry.edgesGroup) {
      entry.edgesGroup.visible = mode !== 'solid';
      if (mode !== 'solid') {
        const wfOpacity = this.state.wfOpacity;
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

    /* 透明模式的深度预通道：实体完全透明时也关闭，否则 depth 会阻挡后方物体 */
    const needDepthPrePass = (mode === 'overlay' || mode === 'edges') && opacity > 0;
    if (needDepthPrePass) {
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

  /** 根据当前 mesh 可见性重建 edge 和 depth 几何体（隐藏 mesh 后不再残留半透明框架） */
  rebuildEdgesForEntry(entry: ModelEntry): void {
    if (this.state.renderMode !== 'solid') {
      this.createHardEdgesForEntry(entry);
      this.createDepthPrePass(entry);
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

  filterUserMeshes(entry: ModelEntry, skipInvisible = false): THREE.Mesh[] {
    const skip = new Set<THREE.Object3D>();
    if (entry.depthPrePassGroup) skip.add(entry.depthPrePassGroup);
    if (entry.edgesGroup) skip.add(entry.edgesGroup);

    const result: THREE.Mesh[] = [];
    entry.wrapper.traverse(c => {
      if (!(c as THREE.Mesh).isMesh) return;
      if (skipInvisible && !c.visible) return;
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
