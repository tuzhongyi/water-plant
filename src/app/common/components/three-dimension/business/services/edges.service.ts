import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { ModelEntry, RenderMode } from '../models/types';
import { ColorsService } from './colors.service';
import { SceneService } from './scene.service';
import { StateService } from './state.service';

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
    /* 使用当前状态对应的边缘颜色，alarm 时 fallback → selected → normal */
    const currentState = this.colorsService.getModelState(entry);
    const colorState =
      currentState === 'alarm'
        ? (entry.colors.alarm ?? entry.colors.selected ?? entry.colors.normal)
        : entry.colors[currentState];
    const edgeColor = colorState.edge;
    const lineWidth = this.state.edgeLineWidth;

    const positionAttr: number[] = [];
    const meshes = this.filterUserMeshes(entry, true);

    /* 先刷新矩阵：wrapper 的子节点可能被就地移动过（如 gizmo 居中偏移），
       若读到旧矩阵，烘焙出的顶点会停留在旧位置上，边框与模型错位 */
    entry.wrapper.updateWorldMatrix(true, true);
    const wrapperWorldInverse = new THREE.Matrix4().copy(entry.wrapper.matrixWorld).invert();

    for (const mesh of meshes) {
      if (!mesh.geometry) continue;
      if (!mesh.geometry.index) continue;

      /* mesh 顶点 → wrapper 局部空间 */
      const meshToWrapper = wrapperWorldInverse.clone().multiply(mesh.matrixWorld);
      extractHardEdgeSegments(mesh, meshToWrapper, thresholdRad, positionAttr);
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
        this.sceneService.renderer.domElement.height,
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
    /* 同上：烘焙前刷新矩阵，保证深度预通道与模型当前姿态一致 */
    entry.wrapper.updateWorldMatrix(true, true);
    const wrapperWorldInverse = new THREE.Matrix4().copy(entry.wrapper.matrixWorld).invert();

    for (const mesh of meshes) {
      if (!mesh.geometry) continue;
      const clone = new THREE.Mesh(
        mesh.geometry,
        new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: true,
        }),
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
        mesh.material.forEach((m) => {
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
        entry.edgesGroup.traverse((c) => {
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
      entry.edgesGroup.traverse((c) => {
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
      entry.depthPrePassGroup.traverse((c) => {
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
    entry.wrapper.traverse((c) => {
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

/**
 * 提取单个 mesh 的硬边线段，顶点坐标写入 out（每 6 个数一条线段，顺序为 x0 y0 z0 x1 y1 z1）。
 *
 * 判定规则：
 * - 只被一个面使用的边（开放边界）一律绘制；
 * - 被多个面共用的边，只要与任一相邻面的夹角 ≥ thresholdRad 就绘制。
 *
 * 关键点：相邻面必须按「顶点位置」判断，不能按顶点索引。导出的 glb 常把顶点按面拆开
 * （同一位置存了多份顶点），按索引判断会让每个三角形的三条边都被当成边界边，
 * 平直墙面被画成三角网格——这正是部分模型边框看起来错位/杂乱的原因。
 *
 * @param mesh 目标网格
 * @param meshToWrapper mesh 局部 → wrapper 局部的矩阵
 * @param thresholdRad 硬边判定夹角（弧度）
 * @param out 输出数组（会被追加）
 */
export function extractHardEdgeSegments(
  mesh: THREE.Mesh,
  meshToWrapper: THREE.Matrix4,
  thresholdRad: number,
  out: number[],
): void {
  const geo = mesh.geometry;
  if (!geo || !geo.index) return;
  const pos = geo.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!pos) return;
  const idx = geo.index;

  const faceCount = Math.floor(idx.count / 3);
  if (faceCount < 1) return;

  /* 1. 顶点焊接：把位置重合的顶点合并为同一个点，得到位置索引 → 焊接编号 */
  const welded = weldVertexPositions(pos);
  const weldedCount = welded.positions.length / 3;
  if (weldedCount < 3) return;

  /* 2. 面法线（用焊接后的位置计算，避免重复顶点的数值差异） */
  const faceNormals = new Float32Array(faceCount * 3);
  const degenerate = new Uint8Array(faceCount);
  for (let f = 0; f < faceCount; f++) {
    const a = welded.indices[idx.getX(f * 3)];
    const b = welded.indices[idx.getX(f * 3 + 1)];
    const c = welded.indices[idx.getX(f * 3 + 2)];
    if (a === b || b === c || a === c) {
      degenerate[f] = 1;
      continue;
    }
    const ax = welded.positions[a * 3];
    const ay = welded.positions[a * 3 + 1];
    const az = welded.positions[a * 3 + 2];
    const ux = welded.positions[b * 3] - ax;
    const uy = welded.positions[b * 3 + 1] - ay;
    const uz = welded.positions[b * 3 + 2] - az;
    const vx = welded.positions[c * 3] - ax;
    const vy = welded.positions[c * 3 + 1] - ay;
    const vz = welded.positions[c * 3 + 2] - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len === 0) {
      degenerate[f] = 1;
      continue;
    }
    faceNormals[f * 3] = nx / len;
    faceNormals[f * 3 + 1] = ny / len;
    faceNormals[f * 3 + 2] = nz / len;
  }

  /* 3. 按焊接编号统计每条边被哪些面共用（key = min * 总数 + max） */
  const neighborFaces = new Map<number, number[]>();
  for (let f = 0; f < faceCount; f++) {
    if (degenerate[f]) continue;
    const a = welded.indices[idx.getX(f * 3)];
    const b = welded.indices[idx.getX(f * 3 + 1)];
    const c = welded.indices[idx.getX(f * 3 + 2)];
    for (const [v0, v1] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const min = Math.min(v0, v1);
      const max = Math.max(v0, v1);
      const key = min * weldedCount + max;
      const faces = neighborFaces.get(key);
      if (faces) {
        faces.push(f);
      } else {
        neighborFaces.set(key, [f]);
      }
    }
  }

  /* 4. 角度筛选后输出线段（顶点为焊接后的位置，转换到 wrapper 局部空间） */
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  for (const [key, faces] of neighborFaces) {
    if (faces.length > 1) {
      let isHard = false;
      for (let i = 1; i < faces.length; i++) {
        const f0 = faces[0] * 3;
        const f1 = faces[i] * 3;
        const dot =
          faceNormals[f0] * faceNormals[f1] +
          faceNormals[f0 + 1] * faceNormals[f1 + 1] +
          faceNormals[f0 + 2] * faceNormals[f1 + 2];
        const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
        if (angle >= thresholdRad) {
          isHard = true;
          break;
        }
      }
      if (!isHard) continue;
    }

    const max = key % weldedCount;
    const min = (key - max) / weldedCount;
    p0.set(
      welded.positions[min * 3],
      welded.positions[min * 3 + 1],
      welded.positions[min * 3 + 2],
    ).applyMatrix4(meshToWrapper);
    p1.set(
      welded.positions[max * 3],
      welded.positions[max * 3 + 1],
      welded.positions[max * 3 + 2],
    ).applyMatrix4(meshToWrapper);
    out.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
  }
}

/** 按位置合并重合顶点，返回「顶点索引 → 焊接编号」映射与去重后的顶点位置 */
function weldVertexPositions(pos: THREE.BufferAttribute): {
  indices: Int32Array;
  positions: number[];
} {
  const count = pos.count;
  const indices = new Int32Array(count);

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  /* 容差取网格自身尺寸的百万分之一，与模型导出单位无关 */
  const diagonal = Math.sqrt(
    (maxX - minX) * (maxX - minX) +
      (maxY - minY) * (maxY - minY) +
      (maxZ - minZ) * (maxZ - minZ),
  );
  const eps = Math.max(diagonal * 1e-6, 1e-6);

  const positions: number[] = [];
  /* 空间哈希：格子 → 该格内的焊接编号，查找时同时看周围 27 格，避免落在格边界上漏判 */
  const cells = new Map<number, number[]>();

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const cx = Math.round(x / eps);
    const cy = Math.round(y / eps);
    const cz = Math.round(z / eps);

    let found = -1;
    for (let dx = -1; dx <= 1 && found < 0; dx++) {
      for (let dy = -1; dy <= 1 && found < 0; dy++) {
        for (let dz = -1; dz <= 1 && found < 0; dz++) {
          const bucket = cells.get(hashCell(cx + dx, cy + dy, cz + dz));
          if (!bucket) continue;
          for (const w of bucket) {
            const ex = positions[w * 3] - x;
            const ey = positions[w * 3 + 1] - y;
            const ez = positions[w * 3 + 2] - z;
            if (ex * ex + ey * ey + ez * ez <= eps * eps) {
              found = w;
              break;
            }
          }
        }
      }
    }

    if (found < 0) {
      found = positions.length / 3;
      positions.push(x, y, z);
      const key = hashCell(cx, cy, cz);
      const bucket = cells.get(key);
      if (bucket) {
        bucket.push(found);
      } else {
        cells.set(key, [found]);
      }
    }
    indices[i] = found;
  }

  return { indices, positions };
}

/** 整数格坐标 → 哈希键（允许碰撞，碰撞只增加候选数量，不影响焊接结果） */
function hashCell(x: number, y: number, z: number): number {
  return ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) | 0;
}
